import { useMemo, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { CATEGORIES, PRODUCT_SUGGESTIONS } from '../data/constants'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { CheckIcon, PlusIcon, CrossIcon, ListCheckIcon } from './icons'
import CategorySelect from './CategorySelect'
import StoreSelect from './StoreSelect'
import Emoji from './Emoji'

const emptyForm = {
  name: '',
  category: CATEGORIES[0] as string,
  brand: '',
  store: '',
  recurring: false,
  toBuy: true
}

export default function AddItemForm({
  initialName,
  onAdded,
  onCancel
}: {
  initialName?: string
  onAdded?: () => void
  onCancel?: () => void
}) {
  const addItem = useAppStore((s) => s.addItem)
  const registerStore = useAppStore((s) => s.registerStore)
  const registerBrand = useAppStore((s) => s.registerBrand)
  const getDefaultStore = useAppStore((s) => s.getDefaultStore)
  const items = useAppStore((s) => s.items)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()

  const [form, setForm] = useState(() => (initialName ? { ...emptyForm, name: initialName } : emptyForm))
  const [nameOpen, setNameOpen] = useState(false)

  const learnedProducts = useMemo(() => {
    const seen = new Map<string, { name: string; category: string; brand?: string; store?: string }>()
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

  const filteredSuggestions =
    form.name.trim().length > 0
      ? learnedProducts.filter((p) => p.name.toLowerCase().includes(form.name.trim().toLowerCase())).slice(0, 6)
      : []

  function pickSuggestion(p: (typeof learnedProducts)[number]) {
    setForm((f) => ({
      ...f,
      name: p.name,
      category: p.category || f.category,
      brand: p.brand || f.brand,
      store: p.store || f.store
    }))
    setNameOpen(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    addItem({
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim(),
      store: form.store.trim() || getDefaultStore(),
      recurring: form.recurring,
      toBuy: form.toBuy
    })
    if (form.store.trim()) registerStore(form.store.trim())
    if (form.brand.trim()) registerBrand(form.brand.trim())
    setForm(emptyForm)
    onAdded?.()
  }

  const iconBg = colorFor(form.category).iconBg

  return (
    <div className="rounded-2xl border border-brand-100 bg-white px-4 py-4 shadow-sm">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <Emoji name={emojiFor(form.category)} size={26} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[140px] flex-1">
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, name: e.target.value }))
                    setNameOpen(true)
                  }}
                  onFocus={() => setNameOpen(true)}
                  onBlur={() => setTimeout(() => setNameOpen(false), 120)}
                  placeholder="Nom de l'article"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold focus:border-brand-400 focus:outline-none"
                />
                {nameOpen && filteredSuggestions.length > 0 && (
                  <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-brand-100 bg-white py-1 shadow-lg">
                    {filteredSuggestions.map((p) => (
                      <li key={p.name}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion(p)}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-brand-50"
                        >
                          <Emoji name={emojiFor(p.category)} size={18} />
                          <span className="flex-1">{p.name}</span>
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                            {p.category}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <StoreSelect
                value={form.store}
                onChange={(v) => setForm((f) => ({ ...f, store: v }))}
                className="w-40 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-48"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <CategorySelect
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                className="w-36 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              />
              <input
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="Marque"
                className="min-w-[100px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, toBuy: !f.toBuy }))}
            title={form.toBuy ? 'Retirer de la liste à acheter' : 'Ajouter à la liste à acheter'}
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              form.toBuy ? 'bg-brand-600 text-white' : 'border border-brand-200 bg-brand-50 text-brand-600'
            }`}
          >
            {form.toBuy ? <ListCheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-5 pl-14">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
              className="check-lg rounded"
            />
            Récurrent
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              onCancel?.()
            }}
            title="Annuler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <CrossIcon className="h-4 w-4" />
          </button>
          <button
            type="submit"
            title="Ajouter"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
