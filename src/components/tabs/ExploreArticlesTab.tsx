import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { PRODUCT_SUGGESTIONS } from '../../data/constants'
import { isInSeason } from '../../data/seasonalProduce'
import { useCategoryEmojiName } from '../../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../../hooks/useCategoryColor'
import Emoji from '../Emoji'
import { ListCheckIcon, PlusIcon } from '../icons'
import type { ProductSuggestion } from '../../types'

interface Toast {
  message: string
}

function sectionId(label: string) {
  return `explore-group-${label}`
}

function scrollToSection(label: string) {
  document.getElementById(sectionId(label))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function ExploreArticlesTab() {
  const addItem = useAppStore((s) => s.addItem)
  const getDefaultStore = useAppStore((s) => s.getDefaultStore)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const [toast, setToast] = useState<Toast | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  function showToast(message: string) {
    clearTimeout(toastTimer.current)
    setToast({ message })
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  const groups = useMemo(() => {
    const map = new Map<string, ProductSuggestion[]>()
    PRODUCT_SUGGESTIONS.forEach((p) => {
      const key = p.category || 'Autre'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, list]) => [cat, [...list].sort((a, b) => a.name.localeCompare(b.name))] as [string, ProductSuggestion[]])
  }, [])

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

  function handleAddToShoppingList(p: ProductSuggestion) {
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
    <div className="mx-auto max-w-lg px-3 pb-24 sm:pb-8 lg:max-w-4xl">
      <p className="mb-4 text-sm text-slate-400">
        Une sélection d'articles courants — ajoute-les directement à ta liste de courses ou à ton catalogue.
      </p>

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
                  {cat}
                </div>
                <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
                  {list.map((p) => {
                    const seasonal = showSeasons && isInSeason(p.name)
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
                            onClick={() => handleAddToShoppingList(p)}
                            title="Ajouter aux courses"
                            className="flex flex-1 items-center justify-center gap-1 rounded-full bg-brand-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-brand-700"
                          >
                            <ListCheckIcon className="h-3.5 w-3.5 shrink-0" />
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

      {toast && (
        <div className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="rounded-full bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">{toast.message}</div>
        </div>
      )}
    </div>
  )
}
