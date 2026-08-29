import { categoryEmoji } from '../data/constants'
import type { ShoppingItem } from '../types'

export function groupByCategory(items: ShoppingItem[]): [string, ShoppingItem[]][] {
  const map = new Map<string, ShoppingItem[]>()
  items.forEach((it) => {
    const key = it.category || 'Autre'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(it)
  })
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cat, list]) => [cat, list.sort((a, b) => a.name.localeCompare(b.name))] as [string, ShoppingItem[]])
}

export function buildListText(store: string, items: ShoppingItem[]): string {
  const groups = groupByCategory(items)
  const lines = [`Liste de courses — ${store}`, '']
  groups.forEach(([cat, list]) => {
    lines.push(`${categoryEmoji(cat)} ${cat.toUpperCase()}`)
    list.forEach((it) => {
      const brand = it.brand ? ` (${it.brand})` : ''
      lines.push(`- ${it.name}${brand}`)
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

export async function copyListToClipboard(store: string, items: ShoppingItem[]): Promise<void> {
  const text = buildListText(store, items)
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
