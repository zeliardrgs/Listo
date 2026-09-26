import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { CheckIcon, PlusIcon, CrossIcon, TrashIcon, ListCheckIcon } from './icons'
import CategorySelect from './CategorySelect'
import StoreSelect from './StoreSelect'
import Emoji from './Emoji'
import type { ShoppingItem } from '../types'

export interface ItemDraft {
  name: string
  category: string
  brand: string
  store: string
  recurring: boolean
  onceOnly: boolean
  toBuy: boolean
}

export function itemToDraft(item: ShoppingItem): ItemDraft {
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

export default function ItemEditForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  onDelete
}: {
  draft: ItemDraft
  onChange: (update: (d: ItemDraft) => ItemDraft) => void
  onSubmit: () => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (draft.name.trim()) onSubmit()
      }}
      className="space-y-3"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colorFor(draft.category).iconBg}`}>
          <Emoji name={emojiFor(draft.category)} size={26} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={draft.name}
              onChange={(e) => onChange((d) => ({ ...d, name: e.target.value }))}
              className="min-w-[140px] flex-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-semibold focus:border-brand-400 focus:outline-none"
            />
            <StoreSelect
              value={draft.store}
              onChange={(v) => onChange((d) => ({ ...d, store: v }))}
              className="w-40 shrink-0 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#5b3d94] px-3 py-2 text-sm sm:w-48"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <CategorySelect
              value={draft.category}
              onChange={(v) => onChange((d) => ({ ...d, category: v }))}
              className="w-36 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#5b3d94] px-2 py-2 text-sm"
            />
            <input
              value={draft.brand}
              onChange={(e) => onChange((d) => ({ ...d, brand: e.target.value }))}
              placeholder="Marque"
              className="min-w-[100px] flex-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange((d) => ({ ...d, toBuy: !d.toBuy }))}
          title={draft.toBuy ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            draft.toBuy ? 'border border-brand-200 dark:border-brand-700/50 bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300' : 'bg-brand-600 text-white'
          }`}
        >
          {draft.toBuy ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex items-center gap-5 pl-14">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={draft.recurring}
            onChange={(e) => onChange((d) => ({ ...d, recurring: e.target.checked, onceOnly: e.target.checked ? false : d.onceOnly }))}
            className="check-lg rounded"
          />
          Favoris
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={draft.onceOnly}
            onChange={(e) => onChange((d) => ({ ...d, onceOnly: e.target.checked, recurring: e.target.checked ? false : d.recurring }))}
            className="check-lg rounded"
          />
          Juste une fois
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Supprimer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          title="Annuler"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
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
  )
}
