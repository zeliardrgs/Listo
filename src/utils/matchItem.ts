import type { ShoppingItem } from '../types'

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
