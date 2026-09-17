import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { importWishlistItemFromUrl } from '../utils/importWishlistItem'
import { CheckIcon, CrossIcon, HeartIcon, LinkIcon } from './icons'
import StoreSelect from './StoreSelect'

export default function AddWishlistItemForm({ onAdded, onCancel }: { onAdded?: () => void; onCancel?: () => void }) {
  const addWishlistItem = useAppStore((s) => s.addWishlistItem)
  const getDefaultStore = useAppStore((s) => s.getDefaultStore)

  const [url, setUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [name, setName] = useState('')
  const [store, setStore] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  function reset() {
    setUrl('')
    setName('')
    setStore('')
    setImageUrl('')
    setSourceUrl('')
    setImportError('')
  }

  async function runImport() {
    const trimmed = url.trim()
    if (!trimmed || importing) return
    setImporting(true)
    setImportError('')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const imported = await importWishlistItemFromUrl(trimmed, controller.signal)
      setName(imported.name)
      setImageUrl(imported.imageUrl || '')
      setStore(imported.store)
      setSourceUrl(trimmed)
    } catch (err) {
      if (controller.signal.aborted) return
      setImportError(err instanceof Error ? err.message : "Échec de l'import")
    } finally {
      setImporting(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    addWishlistItem({
      name: name.trim(),
      store: store.trim() || getDefaultStore(),
      imageUrl: imageUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined
    })
    reset()
    onAdded?.()
  }

  return (
    <div className="rounded-2xl border border-brand-100 dark:border-brand-800/50 bg-white dark:bg-[#5b3d94] px-4 py-4 shadow-sm">
      <div className="mb-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                runImport()
              }
            }}
            placeholder="Coller un lien produit…"
            disabled={importing}
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={runImport}
            disabled={importing || !url.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <LinkIcon className="h-4 w-4" />
            {importing ? 'Import…' : 'Importer'}
          </button>
        </div>
        {importError && <p className="text-xs font-semibold text-red-500 dark:text-red-400">{importError}</p>}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <HeartIcon className="h-6 w-6 text-slate-300" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'article"
              className="w-full rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-semibold focus:border-brand-400 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              <StoreSelect
                value={store}
                onChange={setStore}
                className="w-40 shrink-0 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#5b3d94] px-3 py-2 text-sm sm:w-48"
              />
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Lien de l'image (optionnel)"
                className="min-w-[160px] flex-1 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              reset()
              onCancel?.()
            }}
            title="Annuler"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
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
