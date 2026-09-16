import { categoryEmoji } from '../data/constants'
import { formatRecipeQuantity } from './formatRecipeQuantity'
import type { ShoppingItem } from '../types'

// Optional categoryOrder pins rayons to a specific sequence (e.g. matching a
// store's real aisle layout) — categories not listed in it fall back to
// alphabetical, after the pinned ones.
export function groupByCategory(items: ShoppingItem[], categoryOrder?: string[]): [string, ShoppingItem[]][] {
  const map = new Map<string, ShoppingItem[]>()
  items.forEach((it) => {
    const key = it.category || 'Autre'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(it)
  })
  const entries = Array.from(map.entries()).map(
    ([cat, list]) =>
      [cat, list.sort((a, b) => Number(!!a.checked) - Number(!!b.checked) || a.name.localeCompare(b.name))] as [
        string,
        ShoppingItem[]
      ]
  )

  if (categoryOrder && categoryOrder.length > 0) {
    const rank = new Map(categoryOrder.map((cat, i) => [cat, i]))
    return entries.sort((a, b) => {
      const ai = rank.has(a[0]) ? rank.get(a[0])! : Infinity
      const bi = rank.has(b[0]) ? rank.get(b[0])! : Infinity
      return ai !== bi ? ai - bi : a[0].localeCompare(b[0])
    })
  }

  return entries.sort((a, b) => a[0].localeCompare(b[0]))
}

export function buildListText(store: string, items: ShoppingItem[], categoryOrder?: string[]): string {
  const groups = groupByCategory(items, categoryOrder)
  const lines = [`Liste de courses — ${store}`, '']
  groups.forEach(([cat, list]) => {
    lines.push(`${categoryEmoji(cat)} ${cat.toUpperCase()}`)
    list.forEach((it) => {
      const brand = it.brand ? ` (${it.brand})` : ''
      const qty = formatRecipeQuantity(it.recipeQuantities)
      lines.push(`- ${it.name}${brand}${qty ? ` — ${qty}` : ''}`)
    })
    lines.push('')
  })
  return lines.join('\n').trim()
}

export function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('copy failed')
}

export async function copyListToClipboard(store: string, items: ShoppingItem[], categoryOrder?: string[]): Promise<void> {
  const text = buildListText(store, items, categoryOrder)
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    fallbackCopy(text)
  }
}

export async function exportListAsImage(node: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import('html-to-image')
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' })
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
