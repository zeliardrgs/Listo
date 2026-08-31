import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useHouseholdStore } from '../../store/useHouseholdStore'
import { useSyncStatusStore } from '../../store/useSyncStatusStore'
import { useCategoryEmojiName } from '../../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../../hooks/useCategoryColor'
import { useStoreIcon } from '../../hooks/useStoreIcon'
import StoreIconView from '../StoreIconView'
import { NEUTRAL_GROUP_COLOR, type CategoryColor } from '../../data/categoryColors'
import AddItemForm from '../AddItemForm'
import ItemRow from '../ItemRow'
import Emoji from '../Emoji'
import SearchOmnibox from '../SearchOmnibox'
import { useScrolled } from '../../hooks/useScrolled'
import { useScrollDirection } from '../../hooks/useScrollDirection'
import { PlusIcon, CrossIcon, TrashIcon } from '../icons'
import type { ShoppingItem } from '../../types'

type SortMode = 'name' | 'store' | 'category'

interface Group {
  key: string
  label: string
  items: ShoppingItem[]
  color: CategoryColor
  emojiKind: 'category' | 'store' | null
}

function sectionId(label: string) {
  return `list-group-${label}`
}

function scrollToSection(label: string) {
  document.getElementById(sectionId(label))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function ListTab() {
  const items = useAppStore((s) => s.items)
  const clearShoppingList = useAppStore((s) => s.clearShoppingList)
  const sortMode = useAppStore((s) => s.listSortMode)
  const setSortMode = useAppStore((s) => s.setListSortMode)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const storeIconFor = useStoreIcon()
  const [showForm, setShowForm] = useState(false)
  const [prefillName, setPrefillName] = useState('')
  const [prefillCategory, setPrefillCategory] = useState('')
  const [prefillStore, setPrefillStore] = useState('')
  const [filter, setFilter] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const scrolled = useScrolled()
  const scrollDirection = useScrollDirection()
  const activeHousehold = useHouseholdStore((s) => s.activeCode)
  const itemsLoaded = useSyncStatusStore((s) => s.loaded.items ?? false)
  const isLoading = !!activeHousehold && !itemsLoaded

  const toBuyCount = useMemo(() => items.filter((it) => it.toBuy).length, [items])

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearShoppingList()
    setConfirmClear(false)
  }

  function toggleForm() {
    setShowForm((v) => {
      if (!v) {
        setPrefillName('')
        setPrefillCategory('')
        setPrefillStore('')
      }
      return !v
    })
  }

  function handleQuickCreate(name: string) {
    setPrefillName(name)
    setPrefillCategory('')
    setPrefillStore('')
    setShowForm(true)
  }

  function openAddForGroup(g: Group) {
    setPrefillName('')
    setPrefillCategory(sortMode === 'category' ? g.label : '')
    setPrefillStore(sortMode === 'store' ? g.label : '')
    setShowForm(true)
  }

  const groups = useMemo<Group[]>(() => {
    const filtered = items.filter((it) => it.name.toLowerCase().includes(filter.trim().toLowerCase()))
    if (sortMode === 'name') {
      const map = new Map<string, ShoppingItem[]>()
      filtered.forEach((it) => {
        const letter = it.name.trim().charAt(0).toUpperCase() || '#'
        if (!map.has(letter)) map.set(letter, [])
        map.get(letter)!.push(it)
      })
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, groupItems]) => ({
          key: label,
          label,
          items: groupItems.sort((a, b) => a.name.localeCompare(b.name)),
          color: NEUTRAL_GROUP_COLOR,
          emojiKind: null
        }))
    }
    const key = sortMode === 'store' ? 'store' : 'category'
    const map = new Map<string, ShoppingItem[]>()
    filtered.forEach((it) => {
      const k = it[key] || 'Autre'
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, groupItems]) => ({
        key: label,
        label,
        items: groupItems.sort((a, b) => a.name.localeCompare(b.name)),
        color: sortMode === 'category' ? colorFor(label) : NEUTRAL_GROUP_COLOR,
        emojiKind: sortMode === 'category' ? 'category' : sortMode === 'store' ? 'store' : null
      }))
  }, [items, sortMode, filter, colorFor])

  const resultCount = groups.reduce((n, g) => n + g.items.length, 0)

  useEffect(() => {
    if (groups.length === 0) {
      setActiveSectionId(null)
      return
    }
    const ids = groups.filter((g) => g.items.length > 0).map((g) => sectionId(g.label))
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
  }, [groups, sortMode])

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-3 pt-4 pb-36 sm:block sm:pb-8">
      <div
        className={`hidden sm:sticky sm:top-0 sm:z-30 sm:-mx-3 sm:block sm:overflow-hidden sm:bg-cream sm:px-3 sm:transition-all sm:duration-200 ${
          scrolled ? 'sm:max-h-20 sm:py-2 sm:opacity-100' : 'sm:pointer-events-none sm:max-h-0 sm:py-0 sm:opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <SearchOmnibox value={filter} onChange={setFilter} onQuickCreate={handleQuickCreate} />
          <button
            onClick={toggleForm}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
              showForm ? 'bg-slate-200 text-slate-600' : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
            title="Ajouter un article"
          >
            {showForm ? <CrossIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`order-2 fixed inset-x-0 bottom-16 z-20 bg-cream px-3 py-2 transition-transform duration-200 sm:static sm:z-auto sm:order-none sm:mb-3 sm:translate-y-0 sm:bg-transparent sm:px-0 sm:py-0 ${
          scrollDirection === 'down' ? 'translate-y-[calc(100%+4rem)]' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchOmnibox value={filter} onChange={setFilter} onQuickCreate={handleQuickCreate} />
          <button
            onClick={toggleForm}
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
              showForm ? 'bg-slate-200 text-slate-600' : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
            title="Ajouter un article"
          >
            {showForm ? <CrossIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className="order-1 mb-4 flex flex-col gap-2 sm:order-none sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {toBuyCount > 0 ? (
          <button
            type="button"
            onClick={handleClearAll}
            onBlur={() => setConfirmClear(false)}
            title={confirmClear ? 'Cliquer à nouveau pour confirmer' : 'Vider la liste de course'}
            className={`flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              confirmClear ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {confirmClear ? 'Confirmer ?' : 'Vider la liste'}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {(['name', 'store', 'category'] as SortMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setSortMode(m)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors sm:flex-none sm:py-1.5 sm:text-xs ${
                sortMode === m ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
              }`}
            >
              {m === 'name' ? 'Nom' : m === 'store' ? 'Magasin' : 'Rayon'}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="order-3 mb-4 sm:order-none">
          <AddItemForm
            initialName={prefillName}
            initialCategory={prefillCategory}
            initialStore={prefillStore}
            onAdded={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {isLoading && (
        <div className="order-4 mt-10 flex flex-col items-center gap-3 text-sm text-slate-400 sm:order-none">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          Chargement de la liste…
        </div>
      )}

      {!isLoading && items.length === 0 && !filter.trim() && (
        <p className="order-4 mt-10 text-center text-sm text-slate-400 sm:order-none">
          Aucun article. Utilise la barre de recherche ou le bouton « + » pour en ajouter un.
        </p>
      )}

      {!isLoading && filter.trim() && resultCount === 0 && (
        <p className="order-4 mt-10 text-center text-sm text-slate-400 sm:order-none">
          Aucun article ne correspond à « {filter.trim()} ». Utilise la barre de recherche pour l'ajouter.
        </p>
      )}

      <div className={`order-5 flex sm:order-none ${sortMode === 'name' ? 'gap-2' : 'gap-6'}`}>
        {groups.length > 0 && (
          <aside className={`hidden shrink-0 sm:block ${sortMode === 'name' ? 'sm:w-7' : 'sm:w-44'}`}>
            <div
              className={`sticky z-10 flex flex-col gap-0.5 transition-all duration-200 ${scrolled ? 'top-20' : 'top-4'}`}
            >
              {groups.map((g) => {
                const isActive = activeSectionId === sectionId(g.label)
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => scrollToSection(g.label)}
                    className={`flex items-center rounded-lg text-left text-xs font-semibold transition-colors ${
                      sortMode === 'name' ? 'justify-center py-0.5' : 'gap-1.5 px-2 py-1.5'
                    } ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'}`}
                  >
                    {sortMode === 'category' && <Emoji name={emojiFor(g.label)} size={14} />}
                    {sortMode === 'store' && <StoreIconView icon={storeIconFor(g.label)} size={14} />}
                    {sortMode === 'name' ? (
                      <span className="font-bold">{g.label}</span>
                    ) : (
                      <span className="truncate">{g.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1 space-y-4">
          {groups.map((g) =>
            g.items.length === 0 ? null : (
              <div key={g.key} id={sectionId(g.label)} className={`h-fit scroll-mt-4 rounded-2xl p-3 ${g.color.cardBg}`}>
                <div className={`mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide ${g.color.headerText}`}>
                  {g.emojiKind === 'category' && <Emoji name={emojiFor(g.label)} size={16} />}
                  {g.emojiKind === 'store' && <StoreIconView icon={storeIconFor(g.label)} size={16} />}
                  <span className="min-w-0 flex-1 truncate">
                    {g.label} <span className="font-medium opacity-70">· {g.items.length}</span>
                  </span>
                  {sortMode !== 'name' && (
                    <button
                      type="button"
                      onClick={() => openAddForGroup(g)}
                      title={`Ajouter un article dans ${g.label}`}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60 normal-case tracking-normal hover:bg-white"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {g.items.map((it) => (
                    <ItemRow key={it.id} item={it} />
                  ))}
                </ul>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
