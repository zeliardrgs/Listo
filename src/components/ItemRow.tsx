import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { useStoreIcon } from '../hooks/useStoreIcon'
import { CheckIcon, PlusIcon, CrossIcon, TrashIcon, ListCheckIcon } from './icons'
import CategorySelect from './CategorySelect'
import StoreSelect from './StoreSelect'
import Emoji from './Emoji'
import StoreIconView from './StoreIconView'
import type { ShoppingItem } from '../types'

interface Draft {
  name: string
  category: string
  brand: string
  store: string
  recurring: boolean
  onceOnly: boolean
  toBuy: boolean
}

function toDraft(item: ShoppingItem): Draft {
  return {
    name: item.name,
    category: item.category,
    brand: item.brand,
    store: item.store,
    recurring: item.recurring,
    onceOnly: !!item.onceOnly,
    toBuy: item.toBuy
  }
}

export default function ItemRow({ item }: { item: ShoppingItem }) {
  const updateItem = useAppStore((s) => s.updateItem)
  const removeItem = useAppStore((s) => s.removeItem)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const storeIconFor = useStoreIcon()
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(item))
  const rootRef = useRef<HTMLLIElement>(null)

  function openEdit() {
    setDraft(toDraft(item))
    setExpanded(true)
  }

  function cancel() {
    setExpanded(false)
  }

  useEffect(() => {
    if (!expanded) return
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) cancel()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [expanded])

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    updateItem(item.id, {
      name: draft.name.trim(),
      category: draft.category,
      brand: draft.brand.trim(),
      store: draft.store,
      recurring: draft.recurring,
      onceOnly: draft.onceOnly,
      toBuy: draft.toBuy
    })
    setExpanded(false)
  }

  const iconBg = colorFor(item.category).iconBg

  if (!expanded) {
    return (
      <li
        id={`item-${item.id}`}
        onClick={openEdit}
        className="flex scroll-mt-4 cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Emoji name={emojiFor(item.category)} size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-bold text-slate-800">{item.name}</span>
            {item.recurring && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">★</span>
            )}
            {item.onceOnly && (
              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">1×</span>
            )}
          </div>
          <p className="truncate text-sm text-slate-400">
            {item.category}
            {item.brand ? ` · ${item.brand}` : ''}
          </p>
        </div>
        {item.store && (
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-slate-400">
            <StoreIconView icon={storeIconFor(item.store)} size={15} />
            <span className="hidden sm:inline">{item.store}</span>
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            updateItem(item.id, { toBuy: !item.toBuy })
          }}
          title={item.toBuy ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            item.toBuy ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-600'
          }`}
        >
          {item.toBuy ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </button>
      </li>
    )
  }

  return (
    <li id={`item-${item.id}`} ref={rootRef} className="scroll-mt-4 rounded-2xl border border-brand-100 bg-white px-4 py-4 shadow-sm">
      <form onSubmit={save} className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Emoji name={emojiFor(draft.category)} size={26} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-brand-400 focus:outline-none"
              />
              <StoreSelect
                value={draft.store}
                onChange={(v) => setDraft((d) => ({ ...d, store: v }))}
                className="w-40 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-48"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <CategorySelect
                value={draft.category}
                onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
                className="w-36 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              />
              <input
                value={draft.brand}
                onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                placeholder="Marque"
                className="min-w-[100px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, toBuy: !d.toBuy }))}
            title={draft.toBuy ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              draft.toBuy ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-600'
            }`}
          >
            {draft.toBuy ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-5 pl-14">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={draft.recurring}
              onChange={(e) => setDraft((d) => ({ ...d, recurring: e.target.checked, onceOnly: e.target.checked ? false : d.onceOnly }))}
              className="check-lg rounded"
            />
            Favoris
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={draft.onceOnly}
              onChange={(e) => setDraft((d) => ({ ...d, onceOnly: e.target.checked, recurring: e.target.checked ? false : d.recurring }))}
              className="check-lg rounded"
            />
            Juste une fois
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            title="Supprimer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cancel}
            title="Annuler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <CrossIcon className="h-4 w-4" />
          </button>
          <button
            type="submit"
            title="Valider"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </li>
  )
}
