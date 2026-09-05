import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { matchExistingItem } from '../utils/matchItem'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import RecipeIllustration from './RecipeIllustration'
import Emoji from './Emoji'
import { SearchIcon, CrossIcon, CheckIcon, PlusIcon, ChevronDownIcon, TrashIcon, DownloadIcon } from './icons'
import type { ImportedRecipe } from '../utils/importRecipe'
import type { RecipeIngredient, ShoppingItem } from '../types'

type Resolution = { mode: 'existing'; itemId: string; itemName: string; itemCategory: string } | { mode: 'new' }

// Shown right after a recipe import finishes parsing, before the recipe is
// saved: for every imported ingredient, decide up front which existing
// article it corresponds to (or that it needs a new one) — so importing
// never silently creates a near-duplicate article ("oeuf" vs "Oeufs").
export default function ImportReviewModal({
  imported,
  sourceHost,
  onCancel,
  onConfirm
}: {
  imported: ImportedRecipe
  sourceHost?: string
  onCancel: () => void
  onConfirm: (name: string, ingredients: RecipeIngredient[]) => void
}) {
  const items = useAppStore((s) => s.items)
  const addItem = useAppStore((s) => s.addItem)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()

  const [name, setName] = useState(imported.name)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(imported.ingredients.filter((i) => !i.inStock))
  const [overrides, setOverrides] = useState<Record<string, Resolution>>({})
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function resolutionFor(ing: RecipeIngredient): Resolution {
    if (overrides[ing.id]) return overrides[ing.id]
    const auto = matchExistingItem(ing.name, items)
    return auto ? { mode: 'existing', itemId: auto.id, itemName: auto.name, itemCategory: auto.category } : { mode: 'new' }
  }

  function pickExisting(ingId: string, item: ShoppingItem) {
    setOverrides((o) => ({ ...o, [ingId]: { mode: 'existing', itemId: item.id, itemName: item.name, itemCategory: item.category } }))
    setPickerFor(null)
    setSearch('')
  }

  function pickNew(ingId: string) {
    setOverrides((o) => ({ ...o, [ingId]: { mode: 'new' } }))
    setPickerFor(null)
    setSearch('')
  }

  function renameIngredient(id: string, newName: string) {
    setIngredients((list) => list.map((i) => (i.id === id ? { ...i, name: newName } : i)))
  }

  function removeIngredient(id: string) {
    setIngredients((list) => list.filter((i) => i.id !== id))
    setOverrides((o) => {
      const { [id]: _dropped, ...rest } = o
      return rest
    })
    if (pickerFor === id) setPickerFor(null)
  }

  const searchTrimmed = search.trim()
  const searchResults = searchTrimmed
    ? items
        .filter((it) => it.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        .slice(0, 6)
    : []

  function handleConfirm() {
    const finalIngredients = ingredients.map((ing) => {
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
    onConfirm(name.trim() || imported.name, finalIngredients)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#241c15] shadow-2xl">
        <div className="shrink-0 bg-[#FFF1DC] dark:bg-brand-900/30 px-6 py-4 text-center">
          <h2 className="text-lg font-extrabold text-brand-800 dark:text-brand-200 sm:text-xl">Correspondance des ingrédients</h2>
        </div>

        <div className="flex shrink-0 items-start gap-4 px-6 py-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50 dark:bg-brand-900/40">
            {imported.imageUrl ? (
              <img src={imported.imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <RecipeIllustration category="Plat" className="h-full w-full" />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            {sourceHost && <p className="mb-1 truncate text-xs text-slate-400">Importé depuis {sourceHost}</p>}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-base font-extrabold text-slate-800 dark:text-slate-100 focus:border-brand-400 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''} importé{ingredients.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="mx-auto mb-2 grid max-w-3xl grid-cols-2 gap-3">
            <span className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900/50 px-4 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
              Ingrédients importés
            </span>
            <span className="mx-auto rounded-full bg-brand-100 dark:bg-brand-900/50 px-4 py-1 text-xs font-bold text-brand-700 dark:text-brand-300">
              Ingrédients dans votre liste
            </span>
          </div>

          <div className="mx-auto max-w-3xl space-y-2 rounded-2xl bg-[#FFF1DC] dark:bg-brand-900/30 p-3">
            {ingredients.map((ing) => {
              const resolution = resolutionFor(ing)
              return (
                <div key={ing.id} className="grid grid-cols-2 items-start gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#241c15] px-3 py-2.5 ring-1 ring-slate-100 dark:ring-white/5">
                    <input
                      value={ing.name}
                      onChange={(e) => renameIngredient(ing.id, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(ing.id)}
                      title="Retirer cet ingrédient de l'import"
                      className="shrink-0 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <CrossIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPickerFor((v) => (v === ing.id ? null : ing.id))}
                      className="flex w-full items-center gap-2 rounded-xl bg-white dark:bg-[#241c15] px-3 py-2.5 text-left ring-1 ring-slate-100 dark:ring-white/5"
                    >
                      {resolution.mode === 'existing' ? (
                        <>
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorFor(resolution.itemCategory).iconBg}`}
                          >
                            <Emoji name={emojiFor(resolution.itemCategory)} size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {resolution.itemName}
                            <span className="ml-1 truncate font-normal text-slate-400">· {resolution.itemCategory}</span>
                          </span>
                        </>
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-600 dark:text-brand-300">
                          Créer un nouvel article
                        </span>
                      )}
                      <ChevronDownIcon
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${pickerFor === ing.id ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {pickerFor === ing.id && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1.5 space-y-1 rounded-xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#241c15] p-2 shadow-lg">
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 px-2.5 py-1.5">
                          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                          <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Chercher un article existant…"
                            className="w-full bg-transparent text-xs focus:outline-none"
                          />
                        </div>
                        {searchResults.length > 0 && (
                          <ul className="overflow-hidden rounded-lg ring-1 ring-slate-100 dark:ring-white/5">
                            {searchResults.map((it) => (
                              <li key={it.id}>
                                <button
                                  type="button"
                                  onClick={() => pickExisting(ing.id, it)}
                                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                                >
                                  <CheckIcon className="h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" />
                                  <span className="truncate">{it.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => pickNew(ing.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                        >
                          <PlusIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">Créer « {ing.name} » comme nouvel article</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {ingredients.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">Aucun ingrédient à importer.</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 dark:border-white/5 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            title="Annuler l'import"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700"
          >
            <DownloadIcon className="h-4 w-4" />
            Importer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
