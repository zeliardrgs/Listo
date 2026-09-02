import { Fragment, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { matchExistingItem } from '../utils/matchItem'
import { pluralizeUnit } from '../utils/pluralizeUnit'
import RecipeIllustration from './RecipeIllustration'
import { SearchIcon, CrossIcon, CheckIcon, PlusIcon } from './icons'
import type { ImportedRecipe } from '../utils/importRecipe'
import type { RecipeIngredient, ShoppingItem } from '../types'

type Resolution = { mode: 'existing'; itemId: string; itemName: string } | { mode: 'new' }

// Shown right after a recipe import finishes parsing, before the recipe is
// saved: for every imported ingredient, decide up front which existing
// article it corresponds to (or that it needs a new one) — so importing
// never silently creates a near-duplicate article ("oeuf" vs "Oeufs").
export default function ImportReviewModal({
  imported,
  onCancel,
  onConfirm
}: {
  imported: ImportedRecipe
  onCancel: () => void
  onConfirm: (ingredients: RecipeIngredient[]) => void
}) {
  const items = useAppStore((s) => s.items)
  const addItem = useAppStore((s) => s.addItem)

  const activeIngredients = imported.ingredients.filter((i) => !i.inStock)

  const [overrides, setOverrides] = useState<Record<string, Resolution>>({})
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function resolutionFor(ing: RecipeIngredient): Resolution {
    if (overrides[ing.id]) return overrides[ing.id]
    const auto = matchExistingItem(ing.name, items)
    return auto ? { mode: 'existing', itemId: auto.id, itemName: auto.name } : { mode: 'new' }
  }

  function pickExisting(ingId: string, item: ShoppingItem) {
    setOverrides((o) => ({ ...o, [ingId]: { mode: 'existing', itemId: item.id, itemName: item.name } }))
    setPickerFor(null)
    setSearch('')
  }

  function pickNew(ingId: string) {
    setOverrides((o) => ({ ...o, [ingId]: { mode: 'new' } }))
    setPickerFor(null)
    setSearch('')
  }

  const searchTrimmed = search.trim()
  const searchResults = searchTrimmed
    ? items.filter((it) => it.name.toLowerCase().includes(searchTrimmed.toLowerCase())).slice(0, 6)
    : []

  function handleConfirm() {
    const finalIngredients = imported.ingredients.map((ing) => {
      if (ing.inStock) return ing
      const resolution = resolutionFor(ing)
      if (resolution.mode === 'existing') {
        const item = items.find((it) => it.id === resolution.itemId)
        return item ? { ...ing, name: item.name, category: item.category } : ing
      }
      if (!matchExistingItem(ing.name, items)) {
        addItem({
          name: ing.name,
          category: ing.category || 'Autre',
          brand: '',
          store: '',
          recurring: false,
          toBuy: false
        })
      }
      return ing
    })
    onConfirm(finalIngredients)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
          {imported.imageUrl ? (
            <img src={imported.imageUrl} alt={imported.name} className="h-full w-full object-cover" />
          ) : (
            <RecipeIllustration category="Plat" className="h-full w-full" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-extrabold text-slate-800 sm:text-lg">{imported.name}</h2>
          <p className="text-xs text-slate-400">
            {activeIngredients.length} ingrédient{activeIngredients.length > 1 ? 's' : ''} importé
            {activeIngredients.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          title="Annuler l'import"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50"
        >
          <CrossIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 hidden grid-cols-2 gap-x-6 sm:grid">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Ingrédients de la recette</p>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Article correspondant</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2">
            {activeIngredients.map((ing) => {
              const resolution = resolutionFor(ing)
              return (
                <Fragment key={ing.id}>
                  <div className="flex items-center rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700">
                    {ing.quantity != null && (
                      <span className="mr-1.5 shrink-0 text-slate-400">
                        {ing.quantity} {pluralizeUnit(ing.unit, ing.quantity)}
                      </span>
                    )}
                    <span className="truncate">{ing.name}</span>
                  </div>
                  <div className="rounded-xl border border-slate-100 px-3 py-2">
                    {pickerFor === ing.id ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
                          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
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
                            className="shrink-0 text-slate-300 hover:text-slate-500"
                          >
                            <CrossIcon className="h-3 w-3" />
                          </button>
                        </div>
                        {searchResults.length > 0 && (
                          <ul className="overflow-hidden rounded-lg ring-1 ring-slate-100">
                            {searchResults.map((it) => (
                              <li key={it.id}>
                                <button
                                  type="button"
                                  onClick={() => pickExisting(ing.id, it)}
                                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 hover:bg-brand-50"
                                >
                                  <CheckIcon className="h-3 w-3 shrink-0 text-brand-500" />
                                  <span className="truncate">{it.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => pickNew(ing.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-brand-600 hover:bg-brand-50"
                        >
                          <PlusIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">Créer « {ing.name} » comme nouvel article</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPickerFor(ing.id)}
                        className="flex w-full items-center justify-between gap-2 text-left"
                      >
                        {resolution.mode === 'existing' ? (
                          <span className="truncate text-sm font-semibold text-green-700">→ {resolution.itemName}</span>
                        ) : (
                          <span className="truncate text-sm font-semibold text-brand-600">+ Nouvel article</span>
                        )}
                        <span className="shrink-0 text-[11px] font-semibold text-slate-400">Changer</span>
                      </button>
                    )}
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
        >
          Continuer
        </button>
      </div>
    </div>,
    document.body
  )
}
