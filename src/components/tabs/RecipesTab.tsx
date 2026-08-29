import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useHouseholdStore } from '../../store/useHouseholdStore'
import { useSyncStatusStore } from '../../store/useSyncStatusStore'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import RecipeCard from '../RecipeCard'
import RecipeDetailPane from '../RecipeDetailPane'
import { SearchIcon, PlusIcon, CrossIcon, RecipeIcon } from '../icons'
import type { Recipe, ShoppingItem } from '../../types'

interface Toast {
  message: string
  snapshot?: ShoppingItem[]
}

function sectionId(letter: string) {
  return `recipe-group-${letter}`
}

function scrollToSection(letter: string) {
  document.getElementById(sectionId(letter))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function RecipesTab() {
  const recipes = useAppStore((s) => s.recipes)
  const tags = useAppStore((s) => s.allTags())
  const addIngredientsToList = useAppStore((s) => s.addIngredientsToList)
  const replaceItems = useAppStore((s) => s.replaceItems)
  const addToPlanningQueue = useAppStore((s) => s.addToPlanningQueue)
  const removeRecipeFromPlanning = useAppStore((s) => s.removeRecipeFromPlanning)
  const planningQueue = useAppStore((s) => s.planningQueue)
  const planningSlots = useAppStore((s) => s.planningSlots)
  const activeHousehold = useHouseholdStore((s) => s.activeCode)
  const recipesLoaded = useSyncStatusStore((s) => s.loaded.recipes ?? false)
  const isLoading = !!activeHousehold && !recipesLoaded
  const scrollDirection = useScrollDirection()
  const isDesktop = useIsDesktop(1024)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [addPrefillName, setAddPrefillName] = useState('')
  const [selection, setSelection] = useState<string | 'new' | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const searchRef = useRef<HTMLDivElement>(null)
  const selectedRecipe = selection && selection !== 'new' ? recipes.find((r) => r.id === selection) ?? null : null

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    if (!searchOpen) return
    function onMouseDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [searchOpen])

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      if (search.trim() && !r.name.toLowerCase().includes(search.trim().toLowerCase())) return false
      if (tagFilter && !r.tags.includes(tagFilter)) return false
      return true
    })
  }, [recipes, search, tagFilter])

  const groups = useMemo(() => {
    const map = new Map<string, Recipe[]>()
    filtered.forEach((r) => {
      const letter = r.name.trim().charAt(0).toUpperCase() || '#'
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(r)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([letter, list]) => ({ letter, list: list.sort((a, b) => a.name.localeCompare(b.name)) }))
  }, [filtered])

  useEffect(() => {
    if (groups.length === 0) {
      setActiveSectionId(null)
      return
    }
    const ids = groups.map((g) => sectionId(g.letter))
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return

    setActiveSectionId((current) => (current && ids.includes(current) ? current : ids[0]))

    const intersecting = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) intersecting.set(e.target.id, e.boundingClientRect.top)
          else intersecting.delete(e.target.id)
        })
        if (intersecting.size === 0) return
        let bestId: string | null = null
        let bestTop = -Infinity
        intersecting.forEach((top, id) => {
          if (top > bestTop) {
            bestTop = top
            bestId = id
          }
        })
        if (bestId) setActiveSectionId(bestId)
      },
      { rootMargin: '-72px 0px -70% 0px', threshold: 0 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [groups])

  const plannedRecipeIds = useMemo(() => {
    const ids = new Set(planningQueue.map((i) => i.recipeId))
    Object.values(planningSlots).forEach((list) => list.forEach((i) => ids.add(i.recipeId)))
    return ids
  }, [planningQueue, planningSlots])

  function showToast(message: string, snapshot?: ShoppingItem[]) {
    clearTimeout(toastTimer.current)
    setToast({ message, snapshot })
    toastTimer.current = setTimeout(() => setToast(null), snapshot ? 6000 : 2200)
  }

  function quickAdd(recipe: Recipe) {
    const snapshot = useAppStore.getState().items
    addIngredientsToList(recipe.id)
    showToast(`Ingrédients de « ${recipe.name} » ajoutés à la liste`, snapshot)
  }

  function planRecipe(recipe: Recipe) {
    if (plannedRecipeIds.has(recipe.id)) {
      removeRecipeFromPlanning(recipe.id)
      showToast(`« ${recipe.name} » retiré du planning`)
    } else {
      addToPlanningQueue(recipe.id)
      showToast(`« ${recipe.name} » ajouté au planning`)
    }
  }

  function undoQuickAdd() {
    if (!toast?.snapshot) return
    replaceItems(toast.snapshot)
    clearTimeout(toastTimer.current)
    setToast(null)
  }

  function handleCardClick(recipe: Recipe) {
    setSelection((s) => (s === recipe.id ? null : recipe.id))
  }

  function openNewRecipe(prefillName = '') {
    setAddPrefillName(prefillName)
    setSelection('new')
    setSearchOpen(false)
  }

  function quickCreateRecipeFromSearch() {
    const trimmed = search.trim()
    if (!trimmed) return
    openNewRecipe(trimmed)
    setSearch('')
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col px-3 pt-4 pb-36 sm:pb-4 lg:max-w-6xl">
      <div
        className={`order-2 fixed inset-x-0 bottom-16 z-20 bg-cream px-3 py-2 transition-transform duration-200 sm:static sm:z-auto sm:order-none sm:mb-3 sm:translate-y-0 sm:bg-transparent sm:px-0 sm:py-0 ${
          scrollDirection === 'down' ? 'translate-y-[calc(100%+4rem)]' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center gap-3">
          <div ref={searchRef} className="relative flex-1">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
              <SearchIcon className="h-5 w-5 shrink-0 text-slate-300" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim()) {
                    e.preventDefault()
                    quickCreateRecipeFromSearch()
                  }
                }}
                placeholder="Rechercher une recette"
                className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
              />
            </div>

            {searchOpen && search.trim() && (
              <div className="absolute bottom-full z-30 mb-2 w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-lg sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={quickCreateRecipeFromSearch}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-500 hover:bg-brand-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <RecipeIcon className="h-4 w-4" />
                  </span>
                  Créer la recette « {search.trim()} »
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => openNewRecipe()}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700"
            title="Ajouter une recette"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="order-1 mb-4 flex flex-wrap gap-1.5 sm:order-none">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter((t) => (t === tag ? null : tag))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tagFilter === tag ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="order-3 mt-10 flex flex-col items-center gap-3 text-sm text-slate-400 sm:order-none">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          Chargement des recettes…
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <p className="order-3 mt-10 text-center text-sm text-slate-400 sm:order-none">
          {recipes.length === 0 ? 'Aucune recette. Appuie sur « + » pour en ajouter une.' : 'Aucune recette ne correspond.'}
        </p>
      )}

      <div className={`order-3 sm:order-none ${isDesktop && selection ? 'lg:flex lg:items-start lg:gap-6' : ''}`}>
        <div className={isDesktop && selection ? 'lg:w-[380px] lg:shrink-0' : ''}>
          <div className="flex gap-2">
            {groups.length > 0 && (
              <aside className="hidden shrink-0 lg:block lg:w-7">
                <div className="sticky top-4 flex flex-col gap-0.5">
                  {groups.map((g) => (
                    <button
                      key={g.letter}
                      type="button"
                      onClick={() => scrollToSection(g.letter)}
                      className={`flex items-center justify-center rounded-lg py-0.5 text-xs font-bold transition-colors ${
                        activeSectionId === sectionId(g.letter)
                          ? 'bg-brand-100 text-brand-700'
                          : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                      }`}
                    >
                      {g.letter}
                    </button>
                  ))}
                </div>
              </aside>
            )}

            <div className="min-w-0 flex-1 space-y-4">
              {groups.map((g) => (
                <div key={g.letter} id={sectionId(g.letter)} className="scroll-mt-4">
                  <p className="mb-1.5 hidden px-1 text-xs font-bold uppercase tracking-wide text-slate-400 lg:block">{g.letter}</p>
                  <div
                    className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${
                      isDesktop && selection ? 'lg:grid-cols-2' : 'lg:grid-cols-4 xl:grid-cols-5'
                    }`}
                  >
                    {g.list.map((r) => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        planned={plannedRecipeIds.has(r.id)}
                        selected={selection === r.id}
                        onOpen={() => handleCardClick(r)}
                        onQuickAdd={() => quickAdd(r)}
                        onPlan={() => planRecipe(r)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isDesktop && selection && (
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:flex-1">
            <RecipeDetailPane
              key={selection}
              variant="pane"
              recipe={selectedRecipe ?? undefined}
              initialName={addPrefillName}
              planned={selectedRecipe ? plannedRecipeIds.has(selectedRecipe.id) : false}
              onClose={() => setSelection(null)}
              onQuickAdd={selectedRecipe ? () => quickAdd(selectedRecipe) : undefined}
              onPlan={selectedRecipe ? () => planRecipe(selectedRecipe) : undefined}
            />
          </div>
        )}
      </div>

      {!isDesktop && selection && (
        <RecipeDetailPane
          key={selection}
          variant="modal"
          recipe={selectedRecipe ?? undefined}
          initialName={addPrefillName}
          planned={selectedRecipe ? plannedRecipeIds.has(selectedRecipe.id) : false}
          onClose={() => setSelection(null)}
          onQuickAdd={selectedRecipe ? () => quickAdd(selectedRecipe) : undefined}
          onPlan={selectedRecipe ? () => planRecipe(selectedRecipe) : undefined}
        />
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="flex items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg">
            <span>{toast.message}</span>
            {toast.snapshot && (
              <button
                onClick={undoQuickAdd}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-200 hover:bg-white/20"
              >
                Annuler
              </button>
            )}
            <button
              onClick={() => {
                clearTimeout(toastTimer.current)
                setToast(null)
              }}
              title="Fermer"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <CrossIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
