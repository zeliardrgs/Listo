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
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-slate-300" />
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
          className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
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
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          >
            <CrossIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && trimmed && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={quickCreate}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-brand-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <PlusIcon className="h-4 w-4" />
            </span>
            Ajouter « {trimmed} » à la liste
          </button>
        </div>
      )}
    </div>
  )
}
