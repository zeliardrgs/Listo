// Public CORS proxies used to fetch a third-party page's HTML client-side —
// arbitrary sites don't send CORS headers, so a direct fetch from the
// browser fails. Tried in order; the first proxy that returns content wins.
// r.jina.ai's "Reader" API returns readable Markdown by default — the
// X-Return-Format header asks it for the underlying HTML instead. corsproxy.io
// now requires an API key (401 on anonymous requests) so it's not listed here.
const CORS_PROXIES: { url: (url: string) => string; headers?: Record<string, string> }[] = [
  { url: (url) => `https://r.jina.ai/${url}`, headers: { 'X-Return-Format': 'html' } },
  { url: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` }
]

// Some sites (Cloudflare/Akamai etc.) serve an interstitial "prove you're
// human" page instead of the real content to anything that looks like a bot
// — which a proxy fetch always does. Recognizing it means treating that as a
// failed fetch (and trying the next proxy) instead of happily scraping the
// interstitial's own title/meta tags as if they were the product's.
const BOT_CHALLENGE_MARKERS = [
  'Just a moment...',
  'Attention Required! | Cloudflare',
  'cf-browser-verification',
  'cdn-cgi/challenge-platform',
  'Enable JavaScript and cookies to continue',
  'Pardon Our Interruption'
]

export const BOT_BLOCKED_MESSAGE = 'Page bloquée par une protection anti-robot'

function looksLikeBotChallenge(html: string): boolean {
  return BOT_CHALLENGE_MARKERS.some((marker) => html.includes(marker))
}

export async function fetchHtml(url: string, externalSignal?: AbortSignal): Promise<string> {
  let lastError: unknown
  // A bot-challenge response is the real, actionable reason to report if
  // nothing works — a later proxy's unrelated network hiccup shouldn't hide
  // it, so it takes priority over whatever else fails along the way.
  let botBlocked = false
  for (const proxy of CORS_PROXIES) {
    if (externalSignal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    const onExternalAbort = () => controller.abort()
    externalSignal?.addEventListener('abort', onExternalAbort)
    try {
      const res = await fetch(proxy.url(url), { signal: controller.signal, headers: proxy.headers })
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        continue
      }
      const html = await res.text()
      if (looksLikeBotChallenge(html)) {
        botBlocked = true
        lastError = new Error(BOT_BLOCKED_MESSAGE)
        continue
      }
      if (html.trim().length > 0) return html
      lastError = new Error('Réponse vide')
    } catch (err) {
      if (externalSignal?.aborted) throw err
      lastError = err
    } finally {
      clearTimeout(timeout)
      externalSignal?.removeEventListener('abort', onExternalAbort)
    }
  }
  if (botBlocked) throw new Error(BOT_BLOCKED_MESSAGE)
  throw lastError instanceof Error ? lastError : new Error('Échec de la récupération de la page')
}
