import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { SearchIcon, CrossIcon, CheckIcon } from './icons'
import type { IngredientMatchResult } from '../types'

export default function IngredientMatchModal({
  results,
  recipeName,
  onClose
}: {
  results: IngredientMatchResult[]
  recipeName: string
  onClose: () => void
}) {
  const items = useAppStore((s) => s.items)
  const mergeItemInto = useAppStore((s) => s.mergeItemInto)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const newCount = results.filter((r) => r.createdItemId && !overrides[r.createdItemId]).length
  const matchedCount = results.length - newCount

  function itemName(id: string) {
    return items.find((it) => it.id === id)?.name || ''
  }

  function pickMatch(createdItemId: string, targetId: string) {
    mergeItemInto(createdItemId, targetId)
    setOverrides((o) => ({ ...o, [createdItemId]: targetId }))
    setPickerFor(null)
    setSearch('')
  }

  const searchTrimmed = search.trim()
  const searchResults = searchTrimmed
    ? items
        .filter((it) => it.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        .slice(0, 6)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white dark:bg-[#5b3d94] shadow-xl sm:rounded-2xl"
      >
        <div className="border-b border-slate-100 dark:border-white/5 px-5 py-4">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Ingrédients de « {recipeName} »</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {matchedCount} correspondance{matchedCount > 1 ? 's' : ''} · {newCount} nouvel{newCount > 1 ? 'les' : ''} article
            {newCount > 1 ? 's' : ''}
          </p>
        </div>

        <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto px-5 py-3">
          {results.map((r) => {
            const overrideTarget = r.createdItemId ? overrides[r.createdItemId] : null
            const isNew = !!r.createdItemId && !overrideTarget
            return (
              <li key={r.ingredientName} className="rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{r.ingredientName}</span>
                  {isNew ? (
                    <span className="shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/50 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                      Nouvel article
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:text-green-300">
                      → {overrideTarget ? itemName(overrideTarget) : r.matchedItemName}
                    </span>
                  )}
                </div>

                {isNew && r.createdItemId && (
                  <>
                    {pickerFor === r.createdItemId ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-[#5b3d94] px-2.5 py-1.5 ring-1 ring-slate-200 dark:ring-white/10">
                          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                          <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Chercher un article existant…"
                            className="w-full bg-transparent text-xs focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPickerFor(null)
                              setSearch('')
                            }}
                            className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"
                          >
                            <CrossIcon className="h-3 w-3" />
                          </button>
                        </div>
                        {searchResults.length > 0 && (
                          <ul className="overflow-hidden rounded-lg ring-1 ring-slate-100 dark:ring-white/5">
                            {searchResults.map((it) => (
                              <li key={it.id}>
                                <button
                                  type="button"
                                  onClick={() => pickMatch(r.createdItemId as string, it.id)}
                                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                                >
                                  <CheckIcon className="h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" />
                                  {it.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerFor(r.createdItemId)}
                        className="mt-1 text-[11px] font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
                      >
                        Associer à un article existant
                      </button>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>

        <div className="border-t border-slate-100 dark:border-white/5 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  )
}
