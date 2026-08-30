import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PRODUCT_SUGGESTIONS, UNITS } from '../data/constants'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { useStoreIcon } from '../hooks/useStoreIcon'
import StoreIconView from './StoreIconView'
import { pluralizeUnit } from '../utils/pluralizeUnit'
import { importRecipeFromUrl } from '../utils/importRecipe'
import RecipeIllustration from './RecipeIllustration'
import Emoji from './Emoji'
import {
  SearchIcon,
  PlusIcon,
  MinusIcon,
  CrossIcon,
  TrashIcon,
  ImageIcon,
  ListCheckIcon,
  CopyIcon,
  EditIcon,
  CalendarIcon,
  CheckIcon
} from './icons'
import type { Recipe, RecipeIngredient, Unit } from '../types'

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface Suggestion {
  name: string
  category: string
  brand?: string
  store?: string
  unit?: Unit
}

function scaleQty(q: number, factor: number) {
  const v = q * factor
  return Math.round(v * 100) / 100
}

export default function RecipeDetailPane({
  recipe,
  initialName,
  variant,
  planned,
  onClose,
  onQuickAdd,
  onPlan
}: {
  recipe?: Recipe
  initialName?: string
  variant: 'modal' | 'pane'
  planned?: boolean
  onClose: () => void
  onQuickAdd?: () => void
  onPlan?: () => void
}) {
  const items = useAppStore((s) => s.items)
  const allTags = useAppStore((s) => s.allTags())
  const addItem = useAppStore((s) => s.addItem)
  const updateItem = useAppStore((s) => s.updateItem)
  const addRecipe = useAppStore((s) => s.addRecipe)
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const removeRecipe = useAppStore((s) => s.removeRecipe)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const storeIconFor = useStoreIcon()

  const [mode, setMode] = useState<'view' | 'edit'>(recipe ? 'view' : 'edit')
  const [name, setName] = useState(recipe?.name ?? initialName ?? '')
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? [])
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients ?? [])
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '')
  const [editServings, setEditServings] = useState(recipe?.servings ?? 4)
  const [viewServings, setViewServings] = useState(recipe?.servings ?? 4)
  const [tab, setTab] = useState<'ingredients' | 'instructions'>('ingredients')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [ingredientSearch, setIngredientSearch] = useState('')
  const [ingredientSearchOpen, setIngredientSearchOpen] = useState(false)
  const ingredientSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ingredientSearchOpen) return
    function onMouseDown(e: MouseEvent) {
      if (ingredientSearchRef.current && !ingredientSearchRef.current.contains(e.target as Node)) {
        setIngredientSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ingredientSearchOpen])

  const [showImagePopover, setShowImagePopover] = useState(false)
  const [imageUrlDraft, setImageUrlDraft] = useState(recipe?.imageUrl ?? '')

  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [showImport, setShowImport] = useState(false)

  const category = recipe?.category ?? 'Plat'

  const activeIngredients = useMemo(() => ingredients.filter((i) => !i.inStock), [ingredients])
  const inStockIngredients = useMemo(() => ingredients.filter((i) => i.inStock), [ingredients])

  const learnedProducts = useMemo(() => {
    const seen = new Map<string, Suggestion>()
    items.forEach((it) => {
      if (!seen.has(it.name.toLowerCase())) {
        seen.set(it.name.toLowerCase(), { name: it.name, category: it.category, brand: it.brand, store: it.store })
      }
    })
    PRODUCT_SUGGESTIONS.forEach((p) => {
      if (!seen.has(p.name.toLowerCase())) seen.set(p.name.toLowerCase(), p)
    })
    return Array.from(seen.values())
  }, [items])

  const ingredientTrimmed = ingredientSearch.trim()
  const ingredientSuggestions = ingredientTrimmed
    ? learnedProducts.filter((p) => p.name.toLowerCase().includes(ingredientTrimmed.toLowerCase())).slice(0, 5)
    : []

  function findShoppingItem(ingName: string) {
    return items.find((it) => it.name.toLowerCase() === ingName.toLowerCase())
  }

  function learnedStoreFor(ingName: string): string {
    const match = findShoppingItem(ingName)
    if (match?.store) return match.store
    return learnedProducts.find((p) => p.name.toLowerCase() === ingName.toLowerCase())?.store || ''
  }

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))
  }

  function ensureArticleExists(name: string, category?: string) {
    if (findShoppingItem(name)) return
    addItem({
      name,
      category: category || 'Autre',
      brand: '',
      store: learnedStoreFor(name),
      recurring: false,
      toBuy: false
    })
  }

  function addIngredientFromSuggestion(p: Suggestion) {
    setIngredients((list) => [...list, { id: makeId(), name: p.name, unit: p.unit, category: p.category }])
    ensureArticleExists(p.name, p.category)
    setIngredientSearch('')
    setIngredientSearchOpen(false)
  }

  function quickCreateIngredient() {
    if (!ingredientTrimmed) return
    setIngredients((list) => [...list, { id: makeId(), name: ingredientTrimmed, category: 'Autre' }])
    ensureArticleExists(ingredientTrimmed, 'Autre')
    setIngredientSearch('')
    setIngredientSearchOpen(false)
  }

  function updateIngredientField(id: string, patch: Partial<RecipeIngredient>) {
    setIngredients((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  function removeIngredientRow(id: string) {
    setIngredients((list) => list.filter((i) => i.id !== id))
  }

  function toggleIngredientInList(ing: RecipeIngredient) {
    const existing = findShoppingItem(ing.name)
    if (existing) {
      const turningOn = !existing.toBuy
      updateItem(existing.id, {
        toBuy: turningOn,
        fromRecipes:
          turningOn && recipe ? Array.from(new Set([...(existing.fromRecipes || []), recipe.id])) : existing.fromRecipes
      })
    } else {
      addItem({
        name: ing.name,
        category: ing.category || 'Autre',
        brand: '',
        store: learnedStoreFor(ing.name),
        recurring: false,
        toBuy: true,
        fromRecipes: recipe ? [recipe.id] : undefined
      })
    }
  }

  function applyImageUrl() {
    setImageUrl(imageUrlDraft.trim())
    setShowImagePopover(false)
  }

  async function runImport() {
    if (!importUrl.trim()) return
    setImporting(true)
    setImportError('')
    try {
      const imported = await importRecipeFromUrl(importUrl.trim())
      setName(imported.name)
      setIngredients(imported.ingredients)
      setInstructions(imported.instructions)
      setImageUrl(imported.imageUrl || '')
      setImageUrlDraft(imported.imageUrl || '')
      setShowImport(false)
    } catch (err: any) {
      setImportError(err?.message || "Échec de l'import. Renseigne la recette manuellement.")
    } finally {
      setImporting(false)
    }
  }

  function handleSave() {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const payload = {
      name: trimmedName,
      category,
      servings: editServings,
      ingredients: ingredients.filter((i) => i.name.trim()),
      instructions,
      tags,
      imageUrl: imageUrl || undefined,
      sourceUrl: recipe?.sourceUrl
    }
    if (recipe) {
      updateRecipe(recipe.id, payload)
      setMode('view')
    } else {
      addRecipe(payload)
      onClose()
    }
  }

  function handleCancelEdit() {
    if (recipe) {
      setName(recipe.name)
      setTags(recipe.tags)
      setImageUrl(recipe.imageUrl ?? '')
      setImageUrlDraft(recipe.imageUrl ?? '')
      setIngredients(recipe.ingredients)
      setInstructions(recipe.instructions)
      setEditServings(recipe.servings)
      setShowImagePopover(false)
      setConfirmDelete(false)
      setMode('view')
    } else {
      onClose()
    }
  }

  function handleDuplicate() {
    if (!recipe) return
    addRecipe({
      name: `${name.trim() || recipe.name} (copie)`,
      category,
      servings: editServings,
      ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({ ...i, id: makeId() })),
      instructions,
      tags,
      imageUrl: imageUrl || undefined,
      sourceUrl: recipe.sourceUrl
    })
    onClose()
  }

  function handleDelete() {
    if (!recipe) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    removeRecipe(recipe.id)
    onClose()
  }

  function ingredientRow(ing: RecipeIngredient, deemphasized: boolean) {
    const shoppingItem = findShoppingItem(ing.name)
    const inList = shoppingItem?.toBuy ?? false
    const factor = recipe && recipe.servings ? viewServings / recipe.servings : 1
    const qty = ing.quantity != null ? scaleQty(ing.quantity, factor) : undefined
    return (
      <li
        key={ing.id}
        className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 shadow-sm ring-1 ring-slate-100 ${
          deemphasized ? 'bg-slate-50' : 'bg-white'
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            deemphasized ? 'bg-slate-100' : colorFor(ing.category || 'Autre').iconBg
          }`}
        >
          <Emoji name={emojiFor(ing.category || 'Autre')} size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`truncate text-sm font-bold ${deemphasized ? 'text-slate-500' : 'text-slate-800'}`}>{ing.name}</span>
            {qty != null && (
              <span className="shrink-0 text-xs font-medium text-slate-400">
                • {qty} {pluralizeUnit(ing.unit, qty)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleIngredientInList(ing)}
          title={inList ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
            deemphasized ? 'text-slate-400 hover:bg-white' : ''
          } ${!deemphasized && (inList ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-600')}`}
        >
          {inList ? <ListCheckIcon className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
        </button>
      </li>
    )
  }

  const content = (
    <>
      <div className="relative aspect-[21/9] max-h-48 w-full shrink-0 bg-brand-50">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <RecipeIllustration category={category} className="h-full w-full" />
        )}

        {mode === 'view' && recipe ? (
          <>
            {recipe.tags.length > 0 && (
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-700 shadow">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMode('edit')}
              title="Modifier"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-md hover:bg-white"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <div className="absolute bottom-3 right-3">
              <button
                type="button"
                onClick={() => setShowImagePopover((v) => !v)}
                title="Changer la photo"
                className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-brand-600 shadow-md hover:bg-white"
              >
                <ImageIcon className="h-4 w-4" />
                Changer image
              </button>
              {showImagePopover && (
                <div
                  className="absolute bottom-11 right-0 z-10 w-64 space-y-2 rounded-xl border border-brand-100 bg-white p-2 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={imageUrlDraft}
                    onChange={(e) => setImageUrlDraft(e.target.value)}
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
            {recipe && (
              <button
                type="button"
                onClick={handleDelete}
                title={confirmDelete ? 'Cliquer à nouveau pour confirmer' : 'Supprimer'}
                className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors ${
                  confirmDelete ? 'bg-red-500 text-white' : 'bg-white/90 text-red-500 hover:bg-white'
                }`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mode === 'view' && recipe ? (
          <>
            <h2 className="text-lg font-bold text-slate-800">{recipe.name}</h2>

            <div className="flex items-center justify-between">
              <div className="flex w-fit gap-1 rounded-full bg-slate-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setTab('ingredients')}
                  className={`rounded-full px-3 py-1.5 ${tab === 'ingredients' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
                >
                  Ingrédients
                </button>
                <button
                  type="button"
                  onClick={() => setTab('instructions')}
                  className={`rounded-full px-3 py-1.5 ${tab === 'instructions' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
                >
                  Instructions
                </button>
              </div>
              {tab === 'ingredients' && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewServings((s) => Math.max(1, s - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-14 text-center text-sm font-bold text-slate-700">{viewServings} pers.</span>
                  <button
                    type="button"
                    onClick={() => setViewServings((s) => s + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {tab === 'ingredients' ? (
              <div className="space-y-3">
                <ul className="space-y-1.5">
                  {activeIngredients.map((ing) => ingredientRow(ing, false))}
                  {activeIngredients.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">Aucun ingrédient.</p>
                  )}
                </ul>
                {inStockIngredients.length > 0 && (
                  <div>
                    <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">En réserve</p>
                    <ul className="space-y-1.5">{inStockIngredients.map((ing) => ingredientRow(ing, true))}</ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-slate-600">{recipe.instructions || 'Aucune instruction.'}</p>
            )}
          </>
        ) : (
          <>
            {!recipe && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowImport((v) => !v)}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Importer depuis un lien
                </button>
                {showImport && (
                  <div className="mt-2 space-y-2 rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex gap-2">
                      <input
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://…"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={runImport}
                        disabled={importing}
                        className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                      >
                        {importing ? 'Import…' : 'Importer'}
                      </button>
                    </div>
                    {importError && <p className="text-xs font-semibold text-red-500">{importError}</p>}
                  </div>
                )}
              </div>
            )}

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la recette"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-lg font-bold text-slate-800 focus:border-brand-400 focus:outline-none"
            />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={
                    tags.includes(tag)
                      ? 'rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white'
                      : 'text-xs font-semibold text-brand-500 hover:text-brand-700'
                  }
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex w-fit gap-1 rounded-full bg-slate-100 p-1 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setTab('ingredients')}
                  className={`rounded-full px-3 py-1.5 ${tab === 'ingredients' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
                >
                  Ingrédients
                </button>
                <button
                  type="button"
                  onClick={() => setTab('instructions')}
                  className={`rounded-full px-3 py-1.5 ${tab === 'instructions' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
                >
                  Instructions
                </button>
              </div>
              {tab === 'ingredients' && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditServings((s) => Math.max(1, s - 1))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <MinusIcon className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-14 text-center text-sm font-bold text-slate-700">{editServings} pers.</span>
                  <button
                    type="button"
                    onClick={() => setEditServings((s) => s + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {tab === 'ingredients' ? (
              <div className="space-y-2">
                <div ref={ingredientSearchRef} className="relative">
                  <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-200">
                    <SearchIcon className="h-4 w-4 shrink-0 text-slate-300" />
                    <input
                      value={ingredientSearch}
                      onChange={(e) => {
                        setIngredientSearch(e.target.value)
                        setIngredientSearchOpen(true)
                      }}
                      onFocus={() => setIngredientSearchOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && ingredientTrimmed && ingredientSuggestions.length === 0) {
                          e.preventDefault()
                          quickCreateIngredient()
                        }
                      }}
                      placeholder="Rechercher un article"
                      className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
                    />
                  </div>

                  {ingredientSearchOpen && ingredientTrimmed && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg">
                      {ingredientSuggestions.length > 0 && (
                        <ul className="max-h-56 overflow-y-auto py-1">
                          {ingredientSuggestions.map((p) => (
                            <li key={p.name}>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => addIngredientFromSuggestion(p)}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-brand-50"
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorFor(p.category).iconBg}`}
                                >
                                  <Emoji name={emojiFor(p.category)} size={18} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                                  <span className="block truncate text-xs text-slate-400">{p.category}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={quickCreateIngredient}
                        className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-brand-50"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                          <PlusIcon className="h-4 w-4" />
                        </span>
                        Ajouter « {ingredientTrimmed} » à la liste
                      </button>
                    </div>
                  )}
                </div>

                <ul className="space-y-1.5">
                  {ingredients.map((ing) => (
                    <li
                      key={ing.id}
                      className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorFor(ing.category || 'Autre').iconBg}`}
                      >
                        <Emoji name={emojiFor(ing.category || 'Autre')} size={20} />
                      </div>
                      <span className="min-w-[80px] flex-1 truncate text-sm font-bold text-slate-800">{ing.name}</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ing.quantity ?? ''}
                        onChange={(e) =>
                          updateIngredientField(ing.id, {
                            quantity: e.target.value.trim() === '' ? undefined : Number(e.target.value)
                          })
                        }
                        placeholder="Qté"
                        className="w-14 shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      />
                      <select
                        value={ing.unit ?? ''}
                        onChange={(e) =>
                          updateIngredientField(ing.id, { unit: e.target.value === '' ? undefined : (e.target.value as Unit) })
                        }
                        className="w-20 shrink-0 rounded-lg border border-slate-200 bg-white px-1 py-1.5 text-sm"
                      >
                        <option value="">Unité</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <input
                          type="checkbox"
                          checked={!!ing.inStock}
                          onChange={(e) => updateIngredientField(ing.id, { inStock: e.target.checked })}
                          className="check-lg rounded"
                        />
                        En réserve
                      </label>
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(ing.id)}
                        title="Retirer l'ingrédient"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50"
                      >
                        <CrossIcon className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                  {ingredients.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Aucun ingrédient. Utilise la barre de recherche pour en ajouter.
                    </p>
                  )}
                </ul>
              </div>
            ) : (
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={10}
                placeholder="Instructions (facultatif)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
        {mode === 'view' && recipe ? (
          <>
            <button
              type="button"
              onClick={onPlan}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                planned ? 'bg-brand-50 text-brand-700 hover:bg-red-50 hover:text-red-500' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
              }`}
            >
              {planned ? <CheckIcon className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
              {planned ? 'Planifié' : 'Planifier'}
            </button>
            <button
              type="button"
              onClick={onQuickAdd}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter à la liste
            </button>
          </>
        ) : (
          <>
            <div>
              {recipe && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-bold text-brand-600 hover:bg-brand-100"
                >
                  <CopyIcon className="h-4 w-4" />
                  Dupliquer
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
              >
                Sauvegarder
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )

  if (variant === 'pane') {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        {content}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl lg:max-w-2xl"
      >
        {content}
      </div>
    </div>
  )
}
