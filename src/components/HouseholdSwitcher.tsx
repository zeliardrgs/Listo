import { useEffect, useRef, useState } from 'react'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { ChevronDownIcon, PlusIcon } from './icons'

export default function HouseholdSwitcher({ onOpenSettings }: { onOpenSettings: () => void }) {
  const households = useHouseholdStore((s) => s.households)
  const activeCode = useHouseholdStore((s) => s.activeCode)
  const switchTo = useHouseholdStore((s) => s.switchTo)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = households.find((h) => h.code === activeCode) ?? null
  const others = households.filter((h) => h.code !== activeCode)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  if (!active) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-[10rem] shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/25"
        title="Changer de foyer"
      >
        <span className="min-w-0 flex-1 truncate text-left">{active.name}</span>
        <ChevronDownIcon className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 overflow-hidden rounded-xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#241c15] py-1 text-slate-700 dark:text-slate-200 shadow-lg">
          <div className="border-b border-slate-100 dark:border-white/5 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Foyer actif</p>
            <p className="truncate text-sm font-bold text-brand-700 dark:text-brand-300">{active.name}</p>
          </div>
          {others.length > 0 && (
            <ul>
              {others.map((h) => (
                <li key={h.code}>
                  <button
                    type="button"
                    onClick={() => {
                      switchTo(h.code)
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold hover:bg-brand-50 dark:hover:bg-brand-900/40"
                  >
                    <span className="truncate">{h.name}</span>
                    <span className="shrink-0 text-xs font-normal text-slate-400">{h.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onOpenSettings()
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 dark:border-white/5 px-3 py-2 text-left text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Ajouter un foyer
          </button>
        </div>
      )}
    </div>
  )
}
