import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { useStoreIcon } from '../hooks/useStoreIcon'
import { PlusIcon, ListCheckIcon, EditIcon } from './icons'
import Emoji from './Emoji'
import StoreIconView from './StoreIconView'
import QuantityModal from './QuantityModal'
import ItemEditForm, { itemToDraft, type ItemDraft } from './ItemEditForm'
import { pluralizeUnit } from '../utils/pluralizeUnit'
import type { ShoppingItem } from '../types'

export default function ItemRow({ item, onDelete }: { item: ShoppingItem; onDelete?: (item: ShoppingItem) => void }) {
  const updateItem = useAppStore((s) => s.updateItem)
  const removeItem = useAppStore((s) => s.removeItem)
  const setItemQuantity = useAppStore((s) => s.setItemQuantity)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const storeIconFor = useStoreIcon()
  const [expanded, setExpanded] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [draft, setDraft] = useState<ItemDraft>(() => itemToDraft(item))
  const rootRef = useRef<HTMLLIElement>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout>>()
  const holdStart = useRef<{ x: number; y: number } | null>(null)

  function openEdit() {
    setDraft(itemToDraft(item))
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

  useEffect(() => () => clearTimeout(holdTimer.current), [])

  function clearHold() {
    clearTimeout(holdTimer.current)
    holdStart.current = null
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType !== 'touch' || (e.target as HTMLElement).closest('button')) return
    holdStart.current = { x: e.clientX, y: e.clientY }
    holdTimer.current = setTimeout(openEdit, 500)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!holdStart.current) return
    if (Math.abs(e.clientX - holdStart.current.x) > 10 || Math.abs(e.clientY - holdStart.current.y) > 10) clearHold()
  }

  function save() {
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
      <>
        <li
          id={`item-${item.id}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={clearHold}
          onPointerCancel={clearHold}
          onPointerLeave={clearHold}
          onContextMenu={(e) => e.preventDefault()}
          className="flex scroll-mt-4 items-center gap-3 rounded-2xl bg-white dark:bg-[#5b3d94] px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Emoji name={emojiFor(item.category)} size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
              <button
                type="button"
                onClick={openEdit}
                title="Modifier"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <EditIcon className="h-3.5 w-3.5" />
              </button>
              {item.recurring && (
                <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">★</span>
              )}
              {item.onceOnly && (
                <span className="shrink-0 rounded-full bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">1×</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="truncate text-sm text-slate-400">
                {item.category}
                {item.brand ? ` · ${item.brand}` : ''}
              </p>
              {item.toBuy && (
                <button
                  type="button"
                  onClick={() => setShowQuantityModal(true)}
                  className="shrink-0 rounded-full bg-brand-50 dark:bg-brand-900/40 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60"
                >
                  {item.quantity != null ? `${item.quantity} ${pluralizeUnit(item.unit, item.quantity)}`.trim() : 'Ajuster la quantité'}
                </button>
              )}
            </div>
          </div>
          {item.store && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-slate-400">
              <StoreIconView icon={storeIconFor(item.store)} size={15} />
              <span className="hidden sm:inline">{item.store}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => updateItem(item.id, { toBuy: !item.toBuy })}
            title={item.toBuy ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              item.toBuy ? 'border border-brand-200 dark:border-brand-700/50 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300' : 'bg-brand-600 text-white'
            }`}
          >
            {item.toBuy ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          </button>
        </li>
        {showQuantityModal && (
          <QuantityModal
            itemName={item.name}
            initialQuantity={item.quantity}
            initialUnit={item.unit}
            onClose={() => setShowQuantityModal(false)}
            onSave={(quantity, unit, keepAsDefault) => setItemQuantity(item.id, quantity, unit, keepAsDefault)}
          />
        )}
      </>
    )
  }

  return (
    <li id={`item-${item.id}`} ref={rootRef} className="scroll-mt-4 rounded-2xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] px-4 py-4 shadow-sm">
      <ItemEditForm
        draft={draft}
        onChange={setDraft}
        onSubmit={save}
        onCancel={cancel}
        onDelete={() => (onDelete ? onDelete(item) : removeItem(item.id))}
      />
    </li>
  )
}
