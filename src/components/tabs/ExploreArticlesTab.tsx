import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { EXPLORE_CATEGORY_ORDER, PRODUCT_SUGGESTIONS } from '../../data/constants'
import { isInSeason } from '../../data/seasonalProduce'
import { matchExistingItem } from '../../utils/matchItem'
import { useCategoryEmojiName } from '../../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../../hooks/useCategoryColor'
import Emoji from '../Emoji'
import { CheckIcon, ChevronDownIcon, EyeIcon, EyeOffIcon, ListCheckIcon, PlusIcon, SearchIcon } from '../icons'
import type { ProductSuggestion } from '../../types'

interface Toast {
  message: string
}

const HIDDEN_CATEGORIES_KEY = 'listo-explore-hidden-categories'

function loadHiddenCategories(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_CATEGORIES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function categoryRank(cat: string) {
  const idx = EXPLORE_CATEGORY_ORDER.indexOf(cat)
  return idx === -1 ? EXPLORE_CATEGORY_ORDER.length : idx
}

function sortByCategoryOrder<T extends [string, unknown]>(entries: T[]): T[] {
  return [...entries].sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]) || a[0].localeCompare(b[0]))
}

function sectionId(label: string) {
  return `explore-group-${label}`
}

function scrollToSection(label: string) {
  document.getElementById(sectionId(label))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function ExploreArticlesTab() {
  const addItem = useAppStore((s) => s.addItem)
  const updateItem = useAppStore((s) => s.updateItem)
  const items = useAppStore((s) => s.items)
  const getDefaultStore = useAppStore((s) => s.getDefaultStore)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const [toast, setToast] = useState<Toast | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(loadHiddenCategories)
  const [showHiddenPanel, setShowHiddenPanel] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_CATEGORIES_KEY, JSON.stringify(hiddenCategories))
    } catch {
      // ignore storage errors (private mode, quota, ...)
    }
  }, [hiddenCategories])

  function showToast(message: string) {
    clearTimeout(toastTimer.current)
    setToast({ message })
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  function hideCategory(cat: string) {
    setHiddenCategories((prev) => (prev.includes(cat) ? prev : [...prev, cat]))
  }

  function unhideCategory(cat: string) {
    setHiddenCategories((prev) => prev.filter((c) => c !== cat))
  }

  const allCategoriesInCatalog = useMemo(() => {
    const set = new Set(PRODUCT_SUGGESTIONS.map((p) => p.category || 'Autre'))
    return sortByCategoryOrder(Array.from(set).map((cat) => [cat, null] as [string, null])).map(([cat]) => cat)
  }, [])

  const hiddenCategoryList = useMemo(
    () => allCategoriesInCatalog.filter((cat) => hiddenCategories.includes(cat)),
    [allCategoriesInCatalog, hiddenCategories]
  )

  const groups = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    const filtered = trimmed ? PRODUCT_SUGGESTIONS.filter((p) => p.name.toLowerCase().includes(trimmed)) : PRODUCT_SUGGESTIONS
    const map = new Map<string, ProductSuggestion[]>()
    filtered.forEach((p) => {
      const key = p.category || 'Autre'
      if (hiddenCategories.includes(key)) return
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return sortByCategoryOrder(Array.from(map.entries())).map(
      ([cat, list]) => [cat, [...list].sort((a, b) => a.name.localeCompare(b.name))] as [string, ProductSuggestion[]]
    )
  }, [search, hiddenCategories])

  useEffect(() => {
    if (groups.length === 0) {
      setActiveSectionId(null)
      return
    }
    const ids = groups.map(([cat]) => sectionId(cat))
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

  function handleToggleShoppingList(p: ProductSuggestion) {
    const existing = matchExistingItem(p.name, items)
    if (existing?.toBuy) {
      updateItem(existing.id, { toBuy: false })
      showToast(`« ${p.name} » retiré de la liste de courses`)
      return
    }
    addItem({
      name: p.name,
      category: p.category,
      brand: p.brand || '',
      store: p.store || getDefaultStore(),
      recurring: false,
      toBuy: true
    })
    showToast(`« ${p.name} » ajouté à la liste de courses`)
  }

  function handleAddToMyArticles(p: ProductSuggestion) {
    addItem({
      name: p.name,
      category: p.category,
      brand: p.brand || '',
      store: p.store || getDefaultStore(),
      recurring: false,
      toBuy: false
    })
    showToast(`« ${p.name} » ajouté à mes articles`)
  }

  return (
    <div className="mx-auto max-w-6xl px-3 pb-24 sm:pb-8">
      <p className="mb-4 text-sm text-slate-400">
        Une sélection d'articles courants — ajoute-les directement à ta liste de courses ou à ton catalogue.
      </p>

      <div className="mb-4 flex items-center gap-2 rounded-full bg-white dark:bg-[#5b3d94] px-4 py-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article"
          className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-200 focus:outline-none"
        />
      </div>

      {groups.length === 0 && search.trim() && (
        <p className="mt-10 text-center text-sm text-slate-400">Aucun article ne correspond à « {search.trim()} ».</p>
      )}

      {groups.length === 0 && !search.trim() && hiddenCategoryList.length > 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">Toutes les catégories sont masquées.</p>
      )}

      <div className="flex gap-6">
        <aside className="hidden shrink-0 sm:block sm:w-44">
          <div className="sticky top-4 flex flex-col gap-0.5">
            {groups.map(([cat]) => {
              const isActive = activeSectionId === sectionId(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => scrollToSection(cat)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/40 hover:text-brand-700 dark:hover:text-brand-300'
                  }`}
                >
                  <Emoji name={emojiFor(cat)} size={14} />
                  <span className="truncate">{cat}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-4">
          {groups.map(([cat, list]) => {
            const color = colorFor(cat)
            const showSeasons = cat === 'Fruits' || cat === 'Légumes'
            return (
              <div key={cat} id={sectionId(cat)} className={`scroll-mt-4 rounded-2xl p-3 ${color.cardBg}`}>
                <div className={`mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide ${color.headerText}`}>
                  <Emoji name={emojiFor(cat)} size={16} />
                  <span className="flex-1">{cat}</span>
                  <button
                    type="button"
                    onClick={() => hideCategory(cat)}
                    title="Masquer cette catégorie"
                    className="shrink-0 rounded-full p-1 normal-case text-current opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                  >
                    <EyeOffIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const seasonal = showSeasons && isInSeason(p.name)
                    const inCourses = !!matchExistingItem(p.name, items)?.toBuy
                    return (
                      <li key={p.name} className="rounded-xl bg-white dark:bg-[#5b3d94] px-3 py-2.5">
                        <div className="mb-2 flex items-center gap-1.5">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {p.name}
                          </p>
                          {seasonal && (
                            <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-300">
                              🌱 De saison
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddToMyArticles(p)}
                            title="Ajouter à mes articles"
                            className="flex flex-1 items-center justify-center gap-1 rounded-full border border-brand-200 dark:border-brand-700/50 bg-brand-50 dark:bg-brand-900/40 px-2 py-1.5 text-[11px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                          >
                            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                            Mes articles
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleShoppingList(p)}
                            title={inCourses ? 'Retirer de la liste de courses' : 'Ajouter aux courses'}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-bold ${
                              inCourses
                                ? 'border border-brand-200 dark:border-brand-700/50 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60'
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                          >
                            {inCourses ? (
                              <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ListCheckIcon className="h-3.5 w-3.5 shrink-0" />
                            )}
                            Courses
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {hiddenCategoryList.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowHiddenPanel((v) => !v)}
            className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Voir les catégories masquées ({hiddenCategoryList.length})
            <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${showHiddenPanel ? 'rotate-180' : ''}`} />
          </button>

          {showHiddenPanel && (
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {hiddenCategoryList.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => unhideCategory(cat)}
                    title="Afficher cette catégorie"
                    className="flex items-center gap-1.5 rounded-full bg-white dark:bg-[#5b3d94] px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    <Emoji name={emojiFor(cat)} size={14} />
                    {cat}
                    <EyeIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast.message}</div>
        </div>
      )}
    </div>
  )
}
