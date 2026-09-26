import type { ProductSuggestion, ShoppingItem } from '../types'
import { PRODUCT_SUGGESTIONS } from '../data/constants'

// Strips accents and normalizes whitespace/case for loose name comparison.
// Also folds the œ/æ ligatures to their two-letter spelling, since recipe
// sources and hand-typed articles disagree on which form to use (e.g.
// "Œufs" vs "oeuf").
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Naive French singular/plural fold: drop a trailing "s" (but not from very
// short words, where it's more likely part of the word itself, e.g. "riz").
function singularize(s: string): string {
  return s.length > 3 && s.endsWith('s') ? s.slice(0, -1) : s
}

// Two ingredient/article names are considered the same article if they're
// equal once accents/case are ignored, or only differ by a trailing plural
// "s" (e.g. "Œufs" vs "oeuf" imported from a recipe).
export function namesMatch(a: string, b: string): boolean {
  const na = normalize(a)
  const nb = normalize(b)
  return na === nb || singularize(na) === singularize(nb)
}

export function matchExistingItem(name: string, items: ShoppingItem[]): ShoppingItem | undefined {
  return items.find((it) => namesMatch(it.name, name))
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singularize)
}

function sequenceIndex(haystack: string[], needle: string[]): number {
  for (let i = 0; i + needle.length <= haystack.length; i++) {
    if (needle.every((t, j) => haystack[i + j] === t)) return i
  }
  return -1
}

// Looser than namesMatch, since imported ingredient names carry extra words
// ("gousses d'ail", "oignons rouges"): an Explorer product matches if its
// words appear in order inside the ingredient name. The longest product name
// wins ("pommes de terre" -> "Pomme de terre", not "Pomme"), then the one
// appearing first, since French puts the main noun first ("tomates cerises"
// -> "Tomate", not "Cerise").
export function matchCatalogProduct(name: string): ProductSuggestion | undefined {
  // Accent-sensitive pass first: accent folding alone makes "pâtes" equal "Pâté".
  const accented = (s: string) => singularize(s.trim().toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae'))
  const exact =
    PRODUCT_SUGGESTIONS.find((p) => accented(p.name) === accented(name)) ??
    PRODUCT_SUGGESTIONS.find((p) => namesMatch(p.name, name))
  if (exact) return exact
  const ingTokens = tokens(name)
  let best: ProductSuggestion | undefined
  let bestLen = 0
  let bestPos = Infinity
  for (const p of PRODUCT_SUGGESTIONS) {
    const t = tokens(p.name)
    const pos = sequenceIndex(ingTokens, t)
    if (pos === -1) continue
    if (t.length > bestLen || (t.length === bestLen && pos < bestPos)) {
      best = p
      bestLen = t.length
      bestPos = pos
    }
  }
  return best
}
