import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../store/useAppStore'
import { matchCatalogProduct, matchExistingItem } from '../utils/matchItem'
import { PRODUCT_SUGGESTIONS } from '../data/constants'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import RecipeIllustration from './RecipeIllustration'
import Emoji from './Emoji'
import ItemEditForm, { itemToDraft, type ItemDraft } from './ItemEditForm'
import { SearchIcon, CrossIcon, CheckIcon, PlusIcon, ChevronDownIcon, TrashIcon, DownloadIcon, EditIcon } from './icons'
import type { ImportedRecipe } from '../utils/importRecipe'
import type { ProductSuggestion, RecipeIngredient, ShoppingItem } from '../types'

type Resolution =
  | { mode: 'existing'; itemId: string; itemName: string; itemCategory: string }
  | { mode: 'catalog'; product: ProductSuggestion }
  | { mode: 'new'; name: string }
  | { mode: 'none' }

function existingResolution(item: ShoppingItem): Resolution {
  return { mode: 'existing', itemId: item.id, itemName: item.name, itemCategory: item.category }
}

// Shown right after a recipe import finishes parsing, before the recipe is
// saved: for every imported ingredient, decide up front which article it
// corresponds to. Unmatched ingredients stay "Aucune correspondance" (no
// article created) unless a new article is explicitly created from the
// picker — so importing never silently creates near-duplicates.
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
  const updateItem = useAppStore((s) => s.updateItem)
  const getDefaultStore = useAppStore((s) => s.getDefaultStore)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()

  const [name, setName] = useState(imported.name)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(imported.ingredients.filter((i) => !i.inStock))
  const [overrides, setOverrides] = useState<Record<string, Resolution>>({})
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  // Article edits made in the review, applied on import (updating an
  // existing article, or shaping the one about to be created).
  const [edits, setEdits] = useState<Record<string, ItemDraft>>({})
  const [editing, setEditing] = useState<{ ingId: string; draft: ItemDraft } | null>(null)

  function baseDraft(ing: RecipeIngredient, resolution: Resolution): ItemDraft {
    if (resolution.mode === 'existing') {
      const item = items.find((it) => it.id === resolution.itemId)
      if (item) return itemToDraft(item)
    }
    const product = resolution.mode === 'catalog' ? resolution.product : null
    return {
      name: product?.name ?? (resolution.mode === 'new' ? resolution.name : ing.name),
      category: product?.category ?? (ing.category || 'Autre'),
      brand: product?.brand || '',
      store: product?.store || getDefaultStore(),
      recurring: false,
      onceOnly: false,
      toBuy: false
    }
  }

  function openEditor(ing: RecipeIngredient) {
    setPickerFor(null)
    setEditing({ ingId: ing.id, draft: edits[ing.id] ?? baseDraft(ing, resolutionFor(ing)) })
  }

  function saveEditor() {
    if (!editing) return
    const draft = { ...editing.draft, name: editing.draft.name.trim(), brand: editing.draft.brand.trim() }
    setEdits((e) => ({ ...e, [editing.ingId]: draft }))
    setEditing(null)
  }

  function dropEdit(ingId: string) {
    setEdits((e) => {
      const { [ingId]: _dropped, ...rest } = e
      return rest
    })
    if (editing?.ingId === ingId) setEditing(null)
  }

  function resolutionFor(ing: RecipeIngredient): Resolution {
    if (overrides[ing.id]) return overrides[ing.id]
    const auto = matchExistingItem(ing.name, items)
    if (auto) return existingResolution(auto)
    const product = matchCatalogProduct(ing.name)
    if (!product) return { mode: 'none' }
    // The catalog match may itself already be one of the user's articles
    // ("gousses d'ail" -> Ail, which they already have).
    const existing = matchExistingItem(product.name, items)
    return existing ? existingResolution(existing) : { mode: 'catalog', product }
  }

  function pickResolution(ingId: string, resolution: Resolution) {
    setOverrides((o) => ({ ...o, [ingId]: resolution }))
    dropEdit(ingId)
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
    dropEdit(id)
    if (pickerFor === id) setPickerFor(null)
  }

  const searchTrimmed = search.trim()
  const searchResults = searchTrimmed
    ? items
        .filter((it) => it.name.toLowerCase().includes(searchTrimmed.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        .slice(0, 6)
    : []
  const catalogResults = searchTrimmed
    ? PRODUCT_SUGGESTIONS.filter(
        (p) => p.name.toLowerCase().includes(searchTrimmed.toLowerCase()) && !matchExistingItem(p.name, items)
      )
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
        .slice(0, 6)
    : []

  function handleConfirm() {
    const finalIngredients = ingredients.map((ing) => {
      const resolution = resolutionFor(ing)
      const edit = edits[ing.id]
      if (resolution.mode === 'existing') {
        const item = items.find((it) => it.id === resolution.itemId)
        if (!item) return ing
        if (!edit) return { ...ing, name: item.name, category: item.category }
        updateItem(item.id, edit)
        return { ...ing, name: edit.name, category: edit.category }
      }
      if (resolution.mode === 'none') return ing
      const draft = edit ?? baseDraft(ing, resolution)
      addItem(draft)
      return { ...ing, name: draft.name, category: draft.category }
    })
    onConfirm(name.trim() || imported.name, finalIngredients)
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-[#5b3d94] shadow-2xl">
        <div className="shrink-0 bg-[#FFF1DC] dark:bg-[#4a3178] px-6 py-4 text-center">
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

          <div className="mx-auto max-w-3xl space-y-2 rounded-2xl bg-[#FFF1DC] dark:bg-[#4a3178] p-3">
            {ingredients.map((ing) => {
              const resolution = resolutionFor(ing)
              const edit = edits[ing.id]
              const display =
                resolution.mode === 'none'
                  ? null
                  : edit
                    ? { name: edit.name, category: edit.category }
                    : resolution.mode === 'existing'
                      ? { name: resolution.itemName, category: resolution.itemCategory }
                      : resolution.mode === 'catalog'
                        ? { name: resolution.product.name, category: resolution.product.category }
                        : { name: resolution.name, category: ing.category || 'Autre' }
              const badge =
                resolution.mode === 'catalog'
                  ? { label: 'Explorer', title: 'Article du catalogue Explorer, il sera ajouté à tes articles' }
                  : resolution.mode === 'new'
                    ? { label: 'Nouveau', title: 'Cet article sera créé à l’import' }
                    : resolution.mode === 'existing' && edit
                      ? { label: 'Modifié', title: 'Tes modifications seront appliquées à l’article à l’import' }
                      : null
              const createName = searchTrimmed || ing.name
              return (
                <div key={ing.id} className="space-y-2">
                <div className="grid grid-cols-2 items-start gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#5b3d94] px-3 py-2.5 ring-1 ring-slate-100 dark:ring-white/5">
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

                  <div className="relative flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPickerFor((v) => (v === ing.id ? null : ing.id))}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white dark:bg-[#5b3d94] px-3 py-2.5 text-left ring-1 ring-slate-100 dark:ring-white/5"
                    >
                      {display ? (
                        <>
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorFor(display.category).iconBg}`}
                          >
                            <Emoji name={emojiFor(display.category)} size={16} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {display.name}
                            <span className="ml-1 truncate font-normal text-slate-400">· {display.category}</span>
                          </span>
                        </>
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold italic text-slate-400">
                          Aucune correspondance
                        </span>
                      )}
                      {badge && (
                        <span
                          title={badge.title}
                          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                            badge.label === 'Explorer'
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                              : 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
                          }`}
                        >
                          {badge.label}
                        </span>
                      )}
                      <ChevronDownIcon
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${pickerFor === ing.id ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      disabled={resolution.mode === 'none'}
                      onClick={() => (editing?.ingId === ing.id ? setEditing(null) : openEditor(ing))}
                      title={resolution.mode === 'none' ? 'Choisis ou crée un article pour pouvoir le modifier' : "Modifier l'article"}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-slate-100 dark:ring-white/5 disabled:opacity-40 ${
                        editing?.ingId === ing.id
                          ? 'bg-brand-600 text-white'
                          : 'bg-white dark:bg-[#5b3d94] text-slate-400 enabled:hover:text-brand-600 dark:enabled:hover:text-brand-300'
                      }`}
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                    </button>

                    {pickerFor === ing.id && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1.5 space-y-1 rounded-xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] p-2 shadow-lg">
                        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-white/5 px-2.5 py-1.5">
                          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                          <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Chercher un article…"
                            className="w-full bg-transparent text-xs focus:outline-none"
                          />
                        </div>
                        {searchResults.length > 0 && (
                          <ul className="overflow-hidden rounded-lg ring-1 ring-slate-100 dark:ring-white/5">
                            {searchResults.map((it) => (
                              <li key={it.id}>
                                <button
                                  type="button"
                                  onClick={() => pickResolution(ing.id, existingResolution(it))}
                                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                                >
                                  <CheckIcon className="h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" />
                                  <span className="truncate">{it.name}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {catalogResults.length > 0 && (
                          <>
                            <p className="px-2.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Depuis Explorer</p>
                            <ul className="overflow-hidden rounded-lg ring-1 ring-slate-100 dark:ring-white/5">
                              {catalogResults.map((p) => (
                                <li key={p.name}>
                                  <button
                                    type="button"
                                    onClick={() => pickResolution(ing.id, { mode: 'catalog', product: p })}
                                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                                  >
                                    <Emoji name={emojiFor(p.category)} size={12} />
                                    <span className="truncate">{p.name}</span>
                                    <span className="ml-auto shrink-0 font-normal text-slate-400">{p.category}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => pickResolution(ing.id, { mode: 'new', name: createName })}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
                        >
                          <PlusIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">Créer « {createName} » comme nouvel article</span>
                        </button>
                        {resolution.mode !== 'none' && (
                          <button
                            type="button"
                            onClick={() => pickResolution(ing.id, { mode: 'none' })}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                          >
                            <CrossIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate">Aucune correspondance</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {editing?.ingId === ing.id && (
                  <div className="rounded-2xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] px-4 py-4 shadow-sm">
                    <ItemEditForm
                      draft={editing.draft}
                      onChange={(update) => setEditing((e) => (e ? { ...e, draft: update(e.draft) } : e))}
                      onSubmit={saveEditor}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                )}
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
