import { useEffect, useRef, useState } from 'react'
import { SearchIcon, PlusIcon, CrossIcon } from './icons'

interface Props {
  value: string
  onChange: (value: string) => void
  onQuickCreate: (name: string) => void
}

export default function SearchOmnibox({ value, onChange, onQuickCreate }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  const trimmed = value.trim()

  function quickCreate() {
    if (!trimmed) return
    onQuickCreate(trimmed)
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative flex-1">
      <div className="flex items-center gap-2 rounded-full bg-white dark:bg-[#241c15] px-4 py-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) {
              e.preventDefault()
              quickCreate()
            }
          }}
          placeholder="Rechercher ou ajouter un article"
          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            title="Effacer la recherche"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-500 dark:hover:text-slate-400"
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && trimmed && (
        <div className="absolute bottom-full z-30 mb-2 w-full overflow-hidden rounded-2xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#241c15] shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={quickCreate}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-brand-50 dark:hover:bg-brand-900/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
              <PlusIcon className="h-4 w-4" />
            </span>
            Ajouter « {trimmed} » à la liste
          </button>
        </div>
      )}
    </div>
  )
}
