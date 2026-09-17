import { BOT_BLOCKED_MESSAGE, fetchHtml } from './fetchViaProxy'

export interface ImportedWishlistItem {
  name: string
  imageUrl?: string
  store: string
  price?: number
}

function metaContent(doc: Document, selectors: string[]): string | undefined {
  for (const sel of selectors) {
    const content = doc.querySelector(sel)?.getAttribute('content')?.trim()
    if (content) return content
  }
  return undefined
}

function extractJsonLdProduct(doc: Document): any | null {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '')
      const candidates = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      for (const c of candidates) {
        const types = Array.isArray(c['@type']) ? c['@type'] : [c['@type']]
        if (types.includes('Product')) return c
      }
    } catch {
      continue
    }
  }
  return null
}

// Structured price values (meta tags, JSON-LD) are plain decimals like
// "19.99" per spec, but a stray comma-decimal is handled just in case a site
// doesn't follow it.
function parsePrice(raw: unknown): number | undefined {
  if (raw == null) return undefined
  let str = String(raw).trim()
  if (!str) return undefined
  if (!str.includes('.') && str.includes(',')) str = str.replace(',', '.')
  str = str.replace(/[^\d.-]/g, '')
  const n = parseFloat(str)
  return Number.isFinite(n) ? n : undefined
}

function extractOfferPrice(product: any): number | undefined {
  if (!product?.offers) return undefined
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
  return parsePrice(offer?.price ?? offer?.lowPrice)
}

// Falls back to the site's domain (e.g. "amazon.fr" -> "Amazon") when no
// og:site_name/brand is found on the page, so the item always lands in some
// sensible store group instead of an unlabeled one.
function hostnameLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const base = host.split('.')[0]
    return base.charAt(0).toUpperCase() + base.slice(1)
  } catch {
    return 'Boutique'
  }
}

export async function importWishlistItemFromUrl(url: string, signal?: AbortSignal): Promise<ImportedWishlistItem> {
  let html: string
  try {
    html = await fetchHtml(url, signal)
  } catch (err) {
    if (signal?.aborted) throw err
    if (err instanceof Error && err.message === BOT_BLOCKED_MESSAGE) {
      throw new Error("Ce site bloque la récupération automatique (protection anti-robot). Ajoute l'article manuellement.")
    }
    throw new Error("Impossible de récupérer la page. Vérifie le lien ou ajoute l'article manuellement.")
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const product = extractJsonLdProduct(doc)

  const name =
    metaContent(doc, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    product?.name ||
    doc.querySelector('title')?.textContent?.trim() ||
    'Article importé'

  let imageUrl = metaContent(doc, ['meta[property="og:image"]', 'meta[name="twitter:image"]'])
  if (!imageUrl && product?.image) {
    imageUrl =
      typeof product.image === 'string'
        ? product.image
        : Array.isArray(product.image)
          ? product.image[0]
          : product.image?.url
  }

  const brandName = typeof product?.brand === 'string' ? product.brand : product?.brand?.name
  const store = metaContent(doc, ['meta[property="og:site_name"]']) || brandName || hostnameLabel(url)

  const price =
    parsePrice(metaContent(doc, ['meta[property="product:price:amount"]', 'meta[property="og:price:amount"]'])) ??
    extractOfferPrice(product)

  return { name, imageUrl, store, price }
}
