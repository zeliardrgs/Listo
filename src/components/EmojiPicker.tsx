import { useEffect, useRef, useState } from 'react'
import Emoji from './Emoji'
import { EMOJI_CATALOG } from '../data/emojiCatalog'

export default function EmojiPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, left: rect.left })
    }
    setOpen((v) => !v)
  }

  const filtered = EMOJI_CATALOG.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 60)

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        title="Changer l'emoji"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 dark:border-brand-700/50 bg-brand-50 dark:bg-brand-900/40 hover:bg-brand-100 dark:hover:bg-brand-900/50"
      >
        <Emoji name={value} size={24} />
      </button>
      {open && pos && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-50 w-64 rounded-xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] p-2 shadow-lg"
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un emoji…"
            className="mb-2 w-full rounded-lg border border-slate-200 dark:border-white/10 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <div className="grid max-h-52 grid-cols-6 gap-1 overflow-y-auto">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name)
                  setOpen(false)
                  setQuery('')
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/40 ${
                  name === value ? 'bg-brand-100 dark:bg-brand-900/50 ring-2 ring-brand-400' : ''
                }`}
              >
                <Emoji name={name} size={22} />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-6 py-3 text-center text-xs text-slate-400">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
