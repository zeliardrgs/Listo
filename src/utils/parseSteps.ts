// Splits free-text instructions into steps: one step per non-empty line,
// with any leading numbering ("1.", "2)", "Étape 3 :") or bullet stripped,
// since imported recipes arrive as "1. …\n2. …" and hand-typed ones vary.
export function parseSteps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^(?:[ée]tape\s*)?\d+\s*[.):\-–]\s*/i, '')
        .replace(/^[-•*]\s+/, '')
        .trim()
    )
    .filter(Boolean)
}
