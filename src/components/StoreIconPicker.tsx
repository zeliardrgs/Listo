import { useEffect, useRef, useState } from 'react'
import Emoji from './Emoji'
import StoreIconView from './StoreIconView'
import { EMOJI_CATALOG } from '../data/emojiCatalog'
import type { StoreIconValue } from '../types'

export default function StoreIconPicker({
  value,
  onChange
}: {
  value: StoreIconValue
  onChange: (icon: StoreIconValue) => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'emoji' | 'image'>(value.type)
  const [query, setQuery] = useState('')
  const [urlDraft, setUrlDraft] = useState(value.type === 'image' ? value.value : '')
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
      setMode(value.type)
      setUrlDraft(value.type === 'image' ? value.value : '')
    }
    setOpen((v) => !v)
  }

  function applyImageUrl() {
    const url = urlDraft.trim()
    if (!url) return
    onChange({ type: 'image', value: url })
    setOpen(false)
  }

  const filtered = EMOJI_CATALOG.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 60)

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        title="Changer l'icône"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-200 bg-brand-50 hover:bg-brand-100"
      >
        <StoreIconView icon={value} size={24} />
      </button>
      {open && pos && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-50 w-64 rounded-xl border border-brand-100 bg-white p-2 shadow-lg"
        >
          <div className="mb-2 flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('emoji')}
              className={`flex-1 rounded-md py-1.5 ${mode === 'emoji' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
            >
              Emoji
            </button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`flex-1 rounded-md py-1.5 ${mode === 'image' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
            >
              Image (URL)
            </button>
          </div>

          {mode === 'emoji' ? (
            <>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un emoji…"
                className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              <div className="grid max-h-52 grid-cols-6 gap-1 overflow-y-auto">
                {filtered.map((name) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => {
                      onChange({ type: 'emoji', value: name })
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-brand-50 ${
                      value.type === 'emoji' && name === value.value ? 'bg-brand-100 ring-2 ring-brand-400' : ''
                    }`}
                  >
                    <Emoji name={name} size={22} />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-6 py-3 text-center text-xs text-slate-400">Aucun résultat</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <input
                autoFocus
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyImageUrl()}
                placeholder="URL de l'image"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={applyImageUrl}
                className="w-full rounded-lg bg-brand-600 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
              >
                Appliquer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
