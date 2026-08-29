import type { RecipeIngredient, Unit } from '../types'
import { UNITS } from '../data/constants'

export interface ImportedRecipe {
  name: string
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string
  imageUrl?: string
}

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://r.jina.ai/${url}`
]

async function fetchHtml(url: string): Promise<string> {
  let lastError: unknown
  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      const res = await fetch(buildProxyUrl(url), { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        continue
      }
      const html = await res.text()
      if (html.trim().length > 0) return html
      lastError = new Error('Réponse vide')
    } catch (err) {
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Échec de la récupération de la page')
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function parseQuantityAndUnit(raw: string): { quantity: number; unit: Unit; name: string } {
  const text = raw.trim().replace(/\s+/g, ' ')
  const match = text.match(/^([\d.,]+(?:\s?\/\s?[\d.,]+)?)\s*([a-zA-ZÀ-ÿ.]*)\s*(.*)$/)
  if (!match) return { quantity: 1, unit: 'pièce', name: text }

  let [, qtyRaw, unitRaw, rest] = match
  let quantity = 1
  if (qtyRaw) {
    if (qtyRaw.includes('/')) {
      const [a, b] = qtyRaw.split('/').map((n) => parseFloat(n.replace(',', '.')))
      quantity = b ? a / b : a
    } else {
      quantity = parseFloat(qtyRaw.replace(',', '.'))
    }
  }
  if (Number.isNaN(quantity)) quantity = 1

  const unitMap: Record<string, Unit> = {
    g: 'g',
    gr: 'g',
    grammes: 'g',
    kg: 'kg',
    ml: 'ml',
    cl: 'ml',
    l: 'l',
    litre: 'l',
    litres: 'l',
    paquet: 'paquet',
    paquets: 'paquet',
    boite: 'boîte',
    boites: 'boîte',
    'boîte': 'boîte',
    botte: 'botte',
    tranche: 'tranche',
    tranches: 'tranche',
    piece: 'pièce',
    pieces: 'pièce',
    'pièce': 'pièce',
    'pièces': 'pièce'
  }
  const normalizedUnit = unitRaw.toLowerCase().replace(/\.$/, '')
  let unit: Unit = unitMap[normalizedUnit] || (UNITS.includes(normalizedUnit as Unit) ? (normalizedUnit as Unit) : 'pièce')
  let name = rest.trim()

  if (!unitMap[normalizedUnit] && !UNITS.includes(normalizedUnit as Unit)) {
    name = `${unitRaw} ${rest}`.trim() || text
    unit = 'pièce'
  }
  if (!name) name = text

  return { quantity, unit, name }
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

export async function importRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  let html: string
  try {
    html = await fetchHtml(url)
  } catch {
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
