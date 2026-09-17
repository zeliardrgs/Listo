import type { RecipeIngredient, Unit } from '../types'
import { fetchHtml } from './fetchViaProxy'

export interface ImportedRecipe {
  name: string
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string
  imageUrl?: string
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Unit words/phrases recognized in scraped French recipe text, longest
// phrases first so e.g. "cuillères à café" matches before a bare "cuillère"
// would. Phrases with no `unit` are still stripped from the name (so
// "2 cuillères à café de câpres" doesn't keep "cuillères à café" glued to
// "câpres"), they just don't map onto our fixed Unit vocabulary — the
// quantity is kept, the unit is simply left blank.
const UNIT_PHRASES: { words: string[]; unit?: Unit }[] = [
  { words: ['cuillères à café', 'cuillère à café', 'c. à café', 'càc'] },
  { words: ['cuillères à soupe', 'cuillère à soupe', 'c. à soupe', 'càs'] },
  { words: ['gousses', 'gousse'] },
  { words: ['pincées', 'pincée'], unit: 'pincée' },
  { words: ['sachets', 'sachet'] },
  { words: ['verres', 'verre'] },
  { words: ['brins', 'brin'] },
  { words: ['branches', 'branche'] },
  { words: ['feuilles', 'feuille'] },
  { words: ['tranches', 'tranche'], unit: 'tranche' },
  { words: ['bottes', 'botte'], unit: 'botte' },
  { words: ['paquets', 'paquet'], unit: 'paquet' },
  { words: ['boîtes', 'boites', 'boîte', 'boite'], unit: 'boîte' },
  { words: ['barquettes', 'barquette'], unit: 'barquette' },
  { words: ['pièces', 'pieces', 'pièce', 'piece'], unit: 'pièce' },
  { words: ['grammes', 'gramme', 'gr', 'g'], unit: 'g' },
  { words: ['kg'], unit: 'kg' },
  { words: ['cl'], unit: 'cl' },
  { words: ['ml'], unit: 'ml' },
  { words: ['litres', 'litre', 'l'], unit: 'l' }
]

function stripLeadingArticle(s: string): string {
  return s.replace(/^(de\s+|d['’]\s*)/i, '').trim()
}

function parseQuantityAndUnit(raw: string): { quantity?: number; unit?: Unit; name: string } {
  const text = raw.trim().replace(/\s+/g, ' ')
  const qtyMatch = text.match(/^([\d.,]+(?:\s?\/\s?[\d.,]+)?)\s*(.*)$/)
  if (!qtyMatch) return { name: stripLeadingArticle(text) || text }

  const [, qtyRaw, remainder] = qtyMatch
  let quantity: number | undefined
  if (qtyRaw.includes('/')) {
    const [a, b] = qtyRaw.split('/').map((n) => parseFloat(n.replace(',', '.')))
    quantity = b ? a / b : a
  } else {
    quantity = parseFloat(qtyRaw.replace(',', '.'))
  }
  if (quantity != null && Number.isNaN(quantity)) quantity = undefined

  const lowerRemainder = remainder.toLowerCase()
  const matchedPhrase = UNIT_PHRASES.find((p) =>
    p.words.some((w) => lowerRemainder === w || lowerRemainder.startsWith(`${w} `))
  )

  if (!matchedPhrase) {
    const name = stripLeadingArticle(remainder) || text
    return { quantity, name }
  }

  const matchedWord = matchedPhrase.words.find((w) => lowerRemainder === w || lowerRemainder.startsWith(`${w} `))!
  const afterUnit = remainder.slice(matchedWord.length).trim()
  const name = stripLeadingArticle(afterUnit) || text

  return { quantity, unit: matchedPhrase.unit, name }
}

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

function extractJsonLdRecipe(doc: Document): any | null {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '')
      const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      for (const c of candidates) {
        const types = Array.isArray(c['@type']) ? c['@type'] : [c['@type']]
        if (types.includes('Recipe')) return c
      }
    } catch {
      continue
    }
  }
  return null
}

export async function importRecipeFromUrl(url: string, signal?: AbortSignal): Promise<ImportedRecipe> {
  let html: string
  try {
    html = await fetchHtml(url, signal)
  } catch (err) {
    if (signal?.aborted) throw err
    throw new Error('Impossible de récupérer la page. Vérifie le lien ou ajoute la recette manuellement.')
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const recipe = extractJsonLdRecipe(doc)
  if (!recipe) throw new Error("Aucune recette structurée détectée sur cette page. Ajoute-la manuellement.")

  const name = recipe.name || 'Recette importée'
  let servings = 4
  const yieldRaw = recipe.recipeYield
  if (yieldRaw) {
    const n = parseInt(String(Array.isArray(yieldRaw) ? yieldRaw[0] : yieldRaw).replace(/\D+/g, ''), 10)
    if (!Number.isNaN(n) && n > 0) servings = n
  }

  const rawIngredients: string[] = recipe.recipeIngredient || recipe.ingredients || []
  const ingredients: RecipeIngredient[] = rawIngredients.map((raw) => {
    const { quantity, unit, name } = parseQuantityAndUnit(raw)
    return { id: makeId(), name, quantity, unit }
  })

  let instructions = ''
  const rawInstructions = recipe.recipeInstructions
  if (typeof rawInstructions === 'string') {
    instructions = stripHtml(rawInstructions)
  } else if (Array.isArray(rawInstructions)) {
    instructions = rawInstructions
      .map((step: any, i: number) => {
        if (typeof step === 'string') return `${i + 1}. ${stripHtml(step)}`
        if (step.text) return `${i + 1}. ${stripHtml(step.text)}`
        if (step.itemListElement) {
          return step.itemListElement.map((s: any) => stripHtml(s.text || '')).join('\n')
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  let imageUrl: string | undefined
  const img = recipe.image
  if (typeof img === 'string') imageUrl = img
  else if (Array.isArray(img)) imageUrl = typeof img[0] === 'string' ? img[0] : img[0]?.url
  else if (img?.url) imageUrl = img.url

  return { name, servings, ingredients, instructions, imageUrl }
}
