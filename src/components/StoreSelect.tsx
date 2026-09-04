import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useStoreIcon } from '../hooks/useStoreIcon'
import { ChevronDownIcon } from './icons'
import StoreIconView from './StoreIconView'

export default function StoreSelect({
  value,
  onChange,
  className
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const allStores = useAppStore((s) => s.allStores())
  const addStore = useAppStore((s) => s.addStore)
  const iconFor = useStoreIcon()
  const stores = Array.from(new Set([value, ...allStores])).filter(Boolean)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
        setDraft('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  function commit() {
    const v = draft.trim()
    if (v) {
      addStore(v)
      onChange(v)
    }
    setAdding(false)
    setDraft('')
    setOpen(false)
  }

  function select(s: string) {
    onChange(s)
    setOpen(false)
  }

  if (adding) {
    return (
      <div ref={rootRef} className="relative">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setAdding(false)
              setDraft('')
            }
          }}
          onBlur={commit}
          placeholder="Nom du magasin"
          className={className}
        />
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 text-left ${className ?? ''}`}
      >
        {value ? (
          <>
            <StoreIconView icon={iconFor(value)} size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{value}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-slate-400">Choisir…</span>
        )}
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full min-w-[180px] overflow-y-auto rounded-lg border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#241c15] py-1 shadow-lg">
          {stores.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => select(s)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/40 ${
                s === value ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <StoreIconView icon={iconFor(s)} size={16} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{s}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
          >
            + Nouveau magasin…
          </button>
        </div>
      )}
    </div>
  )
}
