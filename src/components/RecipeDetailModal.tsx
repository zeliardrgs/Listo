import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { PRODUCT_SUGGESTIONS } from '../data/constants'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { useStoreIcon } from '../hooks/useStoreIcon'
import StoreIconView from './StoreIconView'
import { pluralizeUnit } from '../utils/pluralizeUnit'
import { importRecipeFromUrl } from '../utils/importRecipe'
import RecipeIllustration from './RecipeIllustration'
import Emoji from './Emoji'
import { SearchIcon, PlusIcon, CrossIcon, TrashIcon, SaveIcon, ImageIcon, ListCheckIcon, CopyIcon } from './icons'
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

export default function RecipeDetailModal({
  recipe,
  initialName,
  onClose
}: {
  recipe?: Recipe
  initialName?: string
  onClose: () => void
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

  const [name, setName] = useState(recipe?.name ?? initialName ?? '')
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? [])
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? '')
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(recipe?.ingredients ?? [])
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '')
  const [tab, setTab] = useState<'ingredients' | 'instructions'>('ingredients')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [added, setAdded] = useState(false)

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
  const servings = recipe?.servings ?? 4

  const learnedProducts = useMemo(() => {
    const seen = new Map<string, Suggestion>()
    items.forEach((it) => {
      if (!seen.has(it.name.toLowerCase())) {
        seen.set(it.name.toLowerCase(), { name: it.name, category: it.category, brand: it.brand, store: it.store, unit: it.unit })
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

  function ensureArticleExists(name: string, category?: string, unit?: Unit) {
    if (findShoppingItem(name)) return
    addItem({
      name,
      category: category || 'Autre',
      brand: '',
      store: learnedStoreFor(name),
      recurring: false,
      toBuy: false,
      quantity: undefined,
      unit
    })
  }

  function addIngredientFromSuggestion(p: Suggestion) {
    setIngredients((list) => [...list, { id: makeId(), name: p.name, unit: p.unit, category: p.category }])
    ensureArticleExists(p.name, p.category, p.unit)
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
        quantity: ing.quantity,
        unit: ing.unit,
        fromRecipes: recipe ? [recipe.id] : undefined
      })
    }
  }

  function handleBulkAdd() {
    ingredients
      .filter((ing) => ing.name.trim())
      .forEach((ing) => {
        addItem({
          name: ing.name,
          category: ing.category || 'Autre',
          brand: '',
          store: learnedStoreFor(ing.name),
          recurring: false,
          toBuy: true,
          quantity: ing.quantity,
          unit: ing.unit,
          fromRecipes: recipe ? [recipe.id] : undefined
        })
      })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
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
      servings,
      ingredients: ingredients.filter((i) => i.name.trim()),
      instructions,
      tags,
      imageUrl: imageUrl || undefined,
      sourceUrl: recipe?.sourceUrl
    }
    if (recipe) updateRecipe(recipe.id, payload)
    else addRecipe(payload)
    onClose()
  }

  function handleDuplicate() {
    if (!recipe) return
    addRecipe({
      name: `${name.trim() || recipe.name} (copie)`,
      category,
      servings,
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

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl lg:max-w-2xl"
      >
        <div className="relative aspect-[21/9] max-h-48 w-full shrink-0 bg-brand-50">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <RecipeIllustration category={category} className="h-full w-full" />
          )}

          <button
            type="button"
            onClick={handleBulkAdd}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-bold text-brand-600 shadow-md hover:bg-brand-50"
          >
            <PlusIcon className="h-4 w-4" />
            {added ? 'Ajouté ✓' : 'Ajouter à la liste'}
          </button>

          <div className="absolute bottom-3 right-3">
            <button
              type="button"
              onClick={() => setShowImagePopover((v) => !v)}
              title="Changer la photo"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-brand-600 shadow-md hover:bg-white"
            >
              <ImageIcon className="h-4 w-4" />
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
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
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

              <ul className="space-y-2">
                {ingredients.map((ing) => {
                  const shoppingItem = findShoppingItem(ing.name)
                  const inList = shoppingItem?.toBuy ?? false
                  const store = shoppingItem?.store || learnedStoreFor(ing.name)
                  const showQty = ing.quantity != null || ing.unit != null
                  return (
                    <li
                      key={ing.id}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colorFor(ing.category || 'Autre').iconBg}`}
                      >
                        <Emoji name={emojiFor(ing.category || 'Autre')} size={26} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-bold text-slate-800">{ing.name}</span>
                          {showQty && (
                            <span className="shrink-0 text-sm font-medium text-slate-400">
                              • {ing.quantity} {pluralizeUnit(ing.unit, ing.quantity)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-400">{ing.category || 'Autre'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(ing.id)}
                        title="Retirer l'ingrédient"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      {store && (
                        <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-slate-400 sm:flex">
                          <StoreIconView icon={storeIconFor(store)} size={15} />
                          {store}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleIngredientInList(ing)}
                        title={inList ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                          inList ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-600'
                        }`}
                      >
                        {inList ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                      </button>
                    </li>
                  )
                })}
                {ingredients.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Aucun ingrédient. Utilise la barre de recherche pour en ajouter.</p>
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
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 px-4 py-3">
          {recipe ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDelete}
                title={confirmDelete ? 'Cliquer à nouveau pour confirmer' : 'Supprimer'}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  confirmDelete ? 'border-red-500 bg-red-500 text-white' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                }`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDuplicate}
                title="Dupliquer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              title="Annuler"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <CrossIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              title="Enregistrer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
            >
              <SaveIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
