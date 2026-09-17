import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useHouseholdStore } from '../../store/useHouseholdStore'
import { useSyncStatusStore } from '../../store/useSyncStatusStore'
import { useStoreIcon } from '../../hooks/useStoreIcon'
import StoreIconView from '../StoreIconView'
import AddWishlistItemForm from '../AddWishlistItemForm'
import { CrossIcon, HeartIcon, LinkIcon, PlusIcon, TrashIcon } from '../icons'
import type { WishlistItem } from '../../types'

interface Toast {
  message: string
  snapshot?: WishlistItem[]
}

export default function WishlistTab() {
  const wishlistItems = useAppStore((s) => s.wishlistItems)
  const removeWishlistItem = useAppStore((s) => s.removeWishlistItem)
  const replaceWishlistItems = useAppStore((s) => s.replaceWishlistItems)
  const storeIconFor = useStoreIcon()
  const activeHousehold = useHouseholdStore((s) => s.activeCode)
  const wishlistLoaded = useSyncStatusStore((s) => s.loaded.wishlistItems ?? false)
  const isLoading = !!activeHousehold && !wishlistLoaded
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function showToast(message: string, snapshot?: WishlistItem[]) {
    clearTimeout(toastTimer.current)
    setToast({ message, snapshot })
    toastTimer.current = setTimeout(() => setToast(null), snapshot ? 6000 : 2200)
  }

  function undoToast() {
    if (!toast?.snapshot) return
    replaceWishlistItems(toast.snapshot)
    clearTimeout(toastTimer.current)
    setToast(null)
  }

  function handleDelete(item: WishlistItem) {
    const snapshot = wishlistItems
    removeWishlistItem(item.id)
    showToast(`« ${item.name} » supprimé`, snapshot)
  }

  const groups = useMemo(() => {
    const map = new Map<string, WishlistItem[]>()
    wishlistItems.forEach((it) => {
      const key = it.store || 'Autre'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([store, list]) => [store, list.sort((a, b) => a.name.localeCompare(b.name))] as [string, WishlistItem[]])
  }, [wishlistItems])

  return (
    <div className="mx-auto max-w-3xl px-3 pt-4 pb-24 lg:max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400">Souhaits</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm transition-colors ${
            showForm ? 'bg-slate-200 dark:bg-white/15 text-slate-600 dark:text-slate-300' : 'bg-brand-600 text-white hover:bg-brand-700'
          }`}
          title="Ajouter un souhait"
        >
          {showForm ? <CrossIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <AddWishlistItemForm onAdded={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {isLoading && (
        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 dark:border-brand-700/50 border-t-brand-600" />
          Chargement des souhaits…
        </div>
      )}

      {!isLoading && wishlistItems.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-400">
          Aucun souhait pour le moment. Colle un lien produit ou ajoute-en un manuellement avec le bouton « + ».
        </p>
      )}

      <div className="space-y-4">
        {groups.map(([store, list]) => (
          <div key={store} className="rounded-2xl bg-white dark:bg-[#5b3d94] p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <StoreIconView icon={storeIconFor(store)} size={16} />
              <span className="min-w-0 flex-1 truncate">
                {store} <span className="font-medium opacity-70">· {list.length}</span>
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((it) => (
                <li
                  key={it.id}
                  className="group relative overflow-hidden rounded-xl border border-slate-100 dark:border-white/5"
                >
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-white/5">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <HeartIcon className="h-8 w-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex items-start gap-1 p-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {it.name}
                    </span>
                    {it.sourceUrl && (
                      <a
                        href={it.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir le lien"
                        className="shrink-0 rounded-full p-1 text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/40 dark:hover:text-brand-300"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(it)}
                      title="Supprimer"
                      className="shrink-0 rounded-full p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-32 z-50 flex justify-center px-4 sm:bottom-6">
          <div className="flex items-center gap-3 rounded-full bg-slate-900 py-2.5 pl-4 pr-2 text-sm text-white shadow-lg">
            <span>{toast.message}</span>
            {toast.snapshot && (
              <button
                onClick={undoToast}
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
