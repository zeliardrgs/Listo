import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useStoreIcon } from '../hooks/useStoreIcon'
import { DEFAULT_CATEGORY_EMOJI, DEFAULT_STORE_EMOJI } from '../data/fluentEmoji'
import { categoryColorKey } from '../data/categoryColors'
import { createHousehold, householdExists } from '../lib/household'
import CategoryIconPicker from './CategoryIconPicker'
import StoreIconPicker from './StoreIconPicker'
import { CheckIcon, CopyIcon, CrossIcon, PlusIcon, TrashIcon } from './icons'
import type { StoreIconValue } from '../types'

let nextId = 0
function makeDraftId() {
  nextId += 1
  return `draft-${nextId}`
}

interface SimpleDraft {
  id: string
  original: string | null
  name: string
}

interface StoreDraft {
  id: string
  original: string | null
  name: string
  icon: StoreIconValue
}

interface CategoryDraft {
  id: string
  original: string | null
  name: string
  emoji: string
  colorKey: string
}

const SECTIONS = [
  { id: 'settings-household', label: 'Foyer' },
  { id: 'settings-stores', label: 'Magasins' },
  { id: 'settings-categories', label: 'Rayons / types' },
  { id: 'settings-tags', label: 'Tags de recettes' }
]

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SimpleDraftRow({
  draft,
  autoFocus,
  onRename,
  onRemove
}: {
  draft: SimpleDraft
  autoFocus?: boolean
  onRename: (name: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(!!autoFocus)
  const [local, setLocal] = useState(draft.name)
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    const v = local.trim()
    if (v) onRename(v)
    else setLocal(draft.name)
    setEditing(false)
  }

  if (editing) {
    return (
      <li className="flex items-center rounded-lg border border-brand-300 bg-white px-1 py-1 text-sm">
        <input
          ref={inputRef}
          autoFocus
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setLocal(draft.name)
              setEditing(false)
            }
          }}
          onBlur={commit}
          className="w-full rounded-md border-none px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between px-3 py-2.5 text-sm">
      <button
        type="button"
        onClick={() => {
          setLocal(draft.name)
          setEditing(true)
        }}
        title="Cliquer pour renommer"
        className="flex-1 text-left font-medium text-slate-700 hover:text-brand-700"
      >
        {draft.name}
      </button>
      <button
        type="button"
        onClick={onRemove}
        title="Supprimer"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  )
}

function HouseholdSection() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  const setActiveCode = useHouseholdStore((s) => s.setActiveCode)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleCreate() {
    setBusy(true)
    setError(null)
    try {
      const code = await createHousehold()
      setActiveCode(code)
    } catch {
      setError("Impossible de créer le foyer, vérifie ta connexion et réessaie.")
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setBusy(true)
    setError(null)
    try {
      const exists = await householdExists(code)
      if (!exists) {
        setError('Code introuvable, vérifie-le et réessaie.')
        return
      }
      setActiveCode(code)
      setJoinCode('')
    } catch {
      setError('Impossible de vérifier ce code, vérifie ta connexion et réessaie.')
    } finally {
      setBusy(false)
    }
  }

  function handleCopy() {
    if (!activeCode) return
    navigator.clipboard.writeText(activeCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <section id="settings-household" className="scroll-mt-4">
      <div className="mb-2 rounded-2xl bg-[#FFF1DC] px-4 py-3">
        <h3 className="text-sm font-extrabold text-brand-700">Foyer</h3>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        {activeCode ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm text-slate-500">Foyer actif — partage ce code pour inviter quelqu'un :</p>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-brand-50 px-4 py-2 text-2xl font-extrabold tracking-[0.2em] text-brand-700">
                {activeCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copier le code"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-200 text-brand-600 hover:bg-brand-50"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveCode(null)}
              className="mt-1 text-xs font-bold text-red-500 hover:text-red-600"
            >
              Quitter ce foyer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="mb-2 text-sm text-slate-500">Aucun foyer actif pour le moment.</p>
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Créer un foyer
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="h-px flex-1 bg-slate-100" />
              OU
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="flex justify-center gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleJoin()
                  }
                }}
                placeholder="Code du foyer"
                maxLength={6}
                className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-bold uppercase tracking-widest focus:border-brand-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy || !joinCode.trim()}
                className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
              >
                Rejoindre
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-center text-xs font-semibold text-red-500">{error}</p>}
      </div>
    </section>
  )
}

function StoreDraftRow({
  draft,
  autoFocus,
  onChange,
  onRemove
}: {
  draft: StoreDraft
  autoFocus?: boolean
  onChange: (patch: Partial<StoreDraft>) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(!!autoFocus)
  const [local, setLocal] = useState(draft.name)

  function commit() {
    const v = local.trim()
    if (v) onChange({ name: v })
    else setLocal(draft.name)
    setEditing(false)
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2 text-sm">
      <StoreIconPicker value={draft.icon} onChange={(icon) => onChange({ icon })} />
      {editing ? (
        <input
          autoFocus
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setLocal(draft.name)
              setEditing(false)
            }
          }}
          onBlur={commit}
          className="flex-1 rounded-md border border-brand-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setLocal(draft.name)
            setEditing(true)
          }}
          title="Cliquer pour renommer"
          className="flex-1 text-left font-medium text-slate-700 hover:text-brand-700"
        >
          {draft.name}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        title="Supprimer"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  )
}

function CategoryDraftRow({
  draft,
  autoFocus,
  onChange,
  onRemove
}: {
  draft: CategoryDraft
  autoFocus?: boolean
  onChange: (patch: Partial<CategoryDraft>) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(!!autoFocus)
  const [local, setLocal] = useState(draft.name)

  function commit() {
    const v = local.trim()
    if (v) onChange({ name: v })
    else setLocal(draft.name)
    setEditing(false)
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2 text-sm">
      <CategoryIconPicker
        emoji={draft.emoji}
        colorKey={draft.colorKey}
        onChangeEmoji={(name) => onChange({ emoji: name })}
        onChangeColor={(key) => onChange({ colorKey: key })}
      />
      {editing ? (
        <input
          autoFocus
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setLocal(draft.name)
              setEditing(false)
            }
          }}
          onBlur={commit}
          className="flex-1 rounded-md border border-brand-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setLocal(draft.name)
            setEditing(true)
          }}
          title="Cliquer pour renommer"
          className="flex-1 text-left font-medium text-slate-700 hover:text-brand-700"
        >
          {draft.name}
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        title="Supprimer"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  )
}

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const stores = useAppStore((s) => s.allStores())
  const categories = useAppStore((s) => s.allCategories())
  const tags = useAppStore((s) => s.allTags())
  const categoryColorOverrides = useAppStore((s) => s.categoryColorOverrides)
  const addStore = useAppStore((s) => s.addStore)
  const removeStore = useAppStore((s) => s.removeStore)
  const renameStore = useAppStore((s) => s.renameStore)
  const setStoreIcon = useAppStore((s) => s.setStoreIcon)
  const defaultStore = useAppStore((s) => s.defaultStore)
  const setDefaultStore = useAppStore((s) => s.setDefaultStore)
  const addCategory = useAppStore((s) => s.addCategory)
  const removeCategory = useAppStore((s) => s.removeCategory)
  const renameCategory = useAppStore((s) => s.renameCategory)
  const setCategoryEmoji = useAppStore((s) => s.setCategoryEmoji)
  const setCategoryColor = useAppStore((s) => s.setCategoryColor)
  const addTag = useAppStore((s) => s.addTag)
  const removeTag = useAppStore((s) => s.removeTag)
  const renameTag = useAppStore((s) => s.renameTag)
  const emojiFor = useCategoryEmojiName()
  const storeIconFor = useStoreIcon()

  const [storeDrafts, setStoreDrafts] = useState<StoreDraft[]>(() =>
    stores.map((s) => ({ id: s, original: s, name: s, icon: storeIconFor(s) }))
  )
  const [removedStores, setRemovedStores] = useState<string[]>([])
  const [defaultStoreDraftId, setDefaultStoreDraftId] = useState<string | null>(() =>
    defaultStore && stores.includes(defaultStore) ? defaultStore : null
  )
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>(() =>
    categories.map((c) => ({
      id: c,
      original: c,
      name: c,
      emoji: emojiFor(c),
      colorKey: categoryColorKey(c, categoryColorOverrides)
    }))
  )
  const [removedCategories, setRemovedCategories] = useState<string[]>([])
  const [tagDrafts, setTagDrafts] = useState<SimpleDraft[]>(() => tags.map((t) => ({ id: t, original: t, name: t })))
  const [removedTags, setRemovedTags] = useState<string[]>([])
  const [justAddedId, setJustAddedId] = useState<string | null>(null)

  function addStoreDraft() {
    const id = makeDraftId()
    setStoreDrafts((d) => [
      ...d,
      { id, original: null, name: 'Nouveau magasin', icon: { type: 'emoji', value: DEFAULT_STORE_EMOJI } }
    ])
    setJustAddedId(id)
  }

  function addCategoryDraft() {
    const id = makeDraftId()
    setCategoryDrafts((d) => [
      ...d,
      { id, original: null, name: 'Nouveau rayon', emoji: DEFAULT_CATEGORY_EMOJI, colorKey: 'slate' }
    ])
    setJustAddedId(id)
  }

  function addTagDraft() {
    const id = makeDraftId()
    setTagDrafts((d) => [...d, { id, original: null, name: 'Nouveau tag' }])
    setJustAddedId(id)
  }

  function handleSave() {
    removedStores.forEach((name) => removeStore(name))
    storeDrafts.forEach((d) => {
      const name = d.name.trim()
      if (!name) return
      if (d.original == null) addStore(name)
      else if (name !== d.original) renameStore(d.original, name)
      setStoreIcon(name, d.icon)
    })
    const defaultStoreName = defaultStoreDraftId
      ? storeDrafts.find((d) => d.id === defaultStoreDraftId)?.name.trim()
      : ''
    setDefaultStore(defaultStoreName || '')

    removedCategories.forEach((name) => removeCategory(name))
    categoryDrafts.forEach((d) => {
      const name = d.name.trim()
      if (!name) return
      if (d.original == null) {
        addCategory(name, d.emoji)
        setCategoryColor(name, d.colorKey)
      } else {
        if (name !== d.original) renameCategory(d.original, name)
        setCategoryEmoji(name, d.emoji)
        setCategoryColor(name, d.colorKey)
      }
    })

    removedTags.forEach((name) => removeTag(name))
    tagDrafts.forEach((d) => {
      const name = d.name.trim()
      if (!name) return
      if (d.original == null) addTag(name)
      else if (name !== d.original) renameTag(d.original, name)
    })

    onClose()
  }

  const navButtonClass =
    'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-brand-50 hover:text-brand-700'

  return (
    <div className="mx-auto max-w-5xl px-3 pb-28 pt-4 sm:px-6 sm:pb-6">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          title="Fermer"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
        >
          <CrossIcon className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-extrabold text-brand-800">Paramètres</h1>
      </div>

      <nav className="mb-4 -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:hidden">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(s.id)}
            className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700"
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="flex gap-8">
        <aside className="hidden shrink-0 sm:block sm:w-52">
          <div className="sticky top-4 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => scrollToSection(s.id)} className={navButtonClass}>
                {s.label}
              </button>
            ))}
            <div className="mt-4 space-y-2 border-t border-brand-100 pt-4">
              <button
                type="button"
                onClick={handleSave}
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                Annuler
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <HouseholdSection />

          <section id="settings-stores" className="scroll-mt-4">
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-[#FFF1DC] px-4 py-3">
              <h3 className="text-sm font-extrabold text-brand-700">Magasins</h3>
              <button
                type="button"
                onClick={addStoreDraft}
                title="Ajouter un magasin"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
              <label htmlFor="default-store-select" className="text-sm font-semibold text-slate-600">
                Magasin par défaut
              </label>
              <select
                id="default-store-select"
                value={defaultStoreDraftId ?? ''}
                onChange={(e) => setDefaultStoreDraftId(e.target.value || null)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
              >
                <option value="">Automatique (premier magasin)</option>
                {storeDrafts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {storeDrafts.map((draft) => (
                <StoreDraftRow
                  key={draft.id}
                  draft={draft}
                  autoFocus={draft.id === justAddedId}
                  onChange={(patch) => setStoreDrafts((d) => d.map((x) => (x.id === draft.id ? { ...x, ...patch } : x)))}
                  onRemove={() => {
                    setStoreDrafts((d) => d.filter((x) => x.id !== draft.id))
                    if (draft.original) setRemovedStores((r) => [...r, draft.original as string])
                  }}
                />
              ))}
              {storeDrafts.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Aucun magasin.</p>}
            </ul>
          </section>

          <section id="settings-categories" className="scroll-mt-4">
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-[#FFF1DC] px-4 py-3">
              <h3 className="text-sm font-extrabold text-brand-700">Rayons</h3>
              <button
                type="button"
                onClick={addCategoryDraft}
                title="Ajouter un rayon"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {categoryDrafts.map((draft) => (
                <CategoryDraftRow
                  key={draft.id}
                  draft={draft}
                  autoFocus={draft.id === justAddedId}
                  onChange={(patch) =>
                    setCategoryDrafts((d) => d.map((x) => (x.id === draft.id ? { ...x, ...patch } : x)))
                  }
                  onRemove={() => {
                    setCategoryDrafts((d) => d.filter((x) => x.id !== draft.id))
                    if (draft.original) setRemovedCategories((r) => [...r, draft.original as string])
                  }}
                />
              ))}
              {categoryDrafts.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Aucun rayon.</p>}
            </ul>
          </section>

          <section id="settings-tags" className="scroll-mt-4">
            <div className="mb-2 flex items-center justify-between rounded-2xl bg-[#FFF1DC] px-4 py-3">
              <h3 className="text-sm font-extrabold text-brand-700">Tags</h3>
              <button
                type="button"
                onClick={addTagDraft}
                title="Ajouter un tag"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {tagDrafts.map((draft) => (
                <SimpleDraftRow
                  key={draft.id}
                  draft={draft}
                  autoFocus={draft.id === justAddedId}
                  onRename={(name) => setTagDrafts((d) => d.map((x) => (x.id === draft.id ? { ...x, name } : x)))}
                  onRemove={() => {
                    setTagDrafts((d) => d.filter((x) => x.id !== draft.id))
                    if (draft.original) setRemovedTags((r) => [...r, draft.original as string])
                  }}
                />
              ))}
              {tagDrafts.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Aucun tag.</p>}
            </ul>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-brand-100 bg-white p-3 sm:hidden">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  )
}
