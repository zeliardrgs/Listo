import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { groupByCategory, copyListToClipboard, exportListAsImage } from '../../utils/exportList'
import { useCategoryEmojiName } from '../../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../../hooks/useCategoryColor'
import { useStoreIcon } from '../../hooks/useStoreIcon'
import { CheckIcon, CopyIcon, ImageIcon, TrashIcon } from '../icons'
import StoreIconView from '../StoreIconView'
import Emoji from '../Emoji'
import ShoppingListPrintable from '../ShoppingListPrintable'
import { formatRecipeQuantity } from '../../utils/formatRecipeQuantity'
import type { ShoppingItem } from '../../types'

const CELEBRATIONS = [
  'Une bonne chose de faite !',
  'Bravo, courses terminées !',
  'Frigo plein, mission accomplie !',
  'Et voilà, prêt pour la semaine !',
  'Bien joué !',
  'Chariot vide, mission réussie !'
]

const CONFETTI_EMOJI = ['🎉', '✨', '🎊', '⭐️', '🥳']

interface Particle {
  emoji: string
  tx: number
  ty: number
  rot: number
  delay: number
  size: number
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const distance = 90 + Math.random() * 110
    return {
      emoji: CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)],
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      rot: Math.random() * 240 - 120,
      delay: Math.random() * 150,
      size: 1.25 + Math.random() * 1.25
    }
  })
}

export default function ShoppingModeTab() {
  const items = useAppStore((s) => s.items)
  const recipes = useAppStore((s) => s.recipes)
  const updateItem = useAppStore((s) => s.updateItem)
  const emojiFor = useCategoryEmojiName()
  const colorFor = useCategoryColor()
  const storeIconFor = useStoreIcon()
  const resetCheckedForStore = useAppStore((s) => s.resetCheckedForStore)
  const clearShoppingList = useAppStore((s) => s.clearShoppingList)
  const clearShoppingListForStore = useAppStore((s) => s.clearShoppingListForStore)

  const [activeStore, setActiveStore] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmClearStore, setConfirmClearStore] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<{ message: string; particles: Particle[] } | null>(null)
  const printableRef = useRef<HTMLDivElement>(null)

  const toBuyItems = useMemo(() => items.filter((it) => it.toBuy), [items])

  const storeCounts = useMemo(() => {
    const map = new Map<string, number>()
    toBuyItems.forEach((it) => map.set(it.store, (map.get(it.store) || 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [toBuyItems])

  const storeItems = useMemo(
    () => (activeStore ? toBuyItems.filter((it) => it.store === activeStore) : []),
    [toBuyItems, activeStore]
  )
  const checkedCount = storeItems.filter((it) => it.checked).length

  function recipesUsing(item: ShoppingItem): string[] {
    if (!item.fromRecipes || item.fromRecipes.length === 0) return []
    return item.fromRecipes.map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean) as string[]
  }

  function flashToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  async function handleCopy() {
    if (!activeStore) return
    try {
      await copyListToClipboard(activeStore, storeItems)
      flashToast('Liste copiée dans le presse-papiers')
    } catch {
      flashToast('Impossible de copier la liste')
    }
  }

  async function handleExportImage() {
    if (!activeStore || !printableRef.current) return
    try {
      await exportListAsImage(printableRef.current, `liste-${activeStore.toLowerCase().replace(/\s+/g, '-')}.png`)
      flashToast('Image exportée')
    } catch {
      flashToast("Échec de l'export image")
    }
  }

  function finishShopping() {
    if (!activeStore) return
    const store = activeStore
    setCelebration({
      message: CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)],
      particles: makeParticles(20)
    })
    setTimeout(() => {
      resetCheckedForStore(store)
      setActiveStore(null)
      setCelebration(null)
    }, 2000)
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearShoppingList()
    setConfirmClear(false)
  }

  function handleClearStore(store: string) {
    if (confirmClearStore !== store) {
      setConfirmClearStore(store)
      return
    }
    clearShoppingListForStore(store)
    setConfirmClearStore(null)
    if (activeStore === store) setActiveStore(null)
  }

  if (!activeStore) {
    return (
      <div className="mx-auto max-w-lg px-3 pt-4 lg:max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-500">Choisis un magasin</h2>
          {storeCounts.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              onBlur={() => setConfirmClear(false)}
              title={confirmClear ? 'Cliquer à nouveau pour confirmer' : 'Vider la liste de course'}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                confirmClear ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'
              }`}
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {confirmClear ? 'Confirmer ?' : 'Vider la liste'}
            </button>
          )}
        </div>
        {storeCounts.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-400">
            Aucun article « à acheter » pour le moment. Ajoute des articles depuis l'onglet Liste.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {storeCounts.map(([store, count]) => (
              <div
                key={store}
                className="flex w-full items-center gap-1 rounded-xl border border-brand-100 bg-white pr-1.5 shadow-sm hover:bg-brand-50/60"
              >
                <button
                  onClick={() => setActiveStore(store)}
                  className="flex min-w-0 flex-1 items-center justify-between px-4 py-3.5"
                >
                  <span className="flex min-w-0 items-center gap-2 font-bold text-slate-800">
                    <StoreIconView icon={storeIconFor(store)} size={20} />
                    <span className="truncate">{store}</span>
                  </span>
                  <span className="ml-2 shrink-0 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                    {count} article{count > 1 ? 's' : ''}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleClearStore(store)}
                  onBlur={() => setConfirmClearStore((s) => (s === store ? null : s))}
                  title={confirmClearStore === store ? 'Cliquer à nouveau pour confirmer' : `Vider la liste de ${store}`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                    confirmClearStore === store ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50'
                  }`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-3 pb-24 pt-4 sm:pb-4 lg:max-w-3xl">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setActiveStore(null)}
            className="shrink-0 text-slate-400 hover:text-slate-600"
            title="Retour"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <StoreIconView icon={storeIconFor(activeStore)} size={20} />
          <span className="min-w-0 flex-1 truncate font-bold text-slate-800">{activeStore}</span>
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
            {checkedCount} / {storeItems.length} Article{storeItems.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={() => handleClearStore(activeStore)}
          onBlur={() => setConfirmClearStore((s) => (s === activeStore ? null : s))}
          title={confirmClearStore === activeStore ? 'Cliquer à nouveau pour confirmer' : 'Vider la liste de ce magasin'}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
            confirmClearStore === activeStore ? 'bg-red-500 text-white' : 'bg-white text-red-500 hover:bg-red-50'
          }`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50"
        >
          <CopyIcon className="h-4 w-4" />
          Copier texte
        </button>
        <button
          onClick={handleExportImage}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50"
        >
          <ImageIcon className="h-4 w-4" />
          Télécharger Image
        </button>
      </div>

      {toast && (
        <div className="mb-3 rounded-lg bg-brand-800 px-3 py-2 text-center text-xs font-bold text-white">{toast}</div>
      )}

      <div className="space-y-4 pb-20">
        {groupByCategory(storeItems).map(([cat, list]) => {
          const color = colorFor(cat)
          return (
            <div key={cat} className="overflow-hidden rounded-2xl shadow-sm">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${color.cardBg} ${color.headerText}`}>
                <Emoji name={emojiFor(cat)} size={16} />
                {cat} <span className="font-medium opacity-70">· {list.length}</span>
              </div>
              <ul className="bg-white">
                {list.map((it) => (
                  <li
                    key={it.id}
                    onClick={() => updateItem(it.id, { checked: !it.checked })}
                    className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2.5 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateItem(it.id, { checked: !it.checked })
                      }}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                        it.checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {it.checked && <CheckIcon className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${it.checked ? 'text-slate-300 line-through' : 'text-slate-800'}`}
                        >
                          {it.name}
                        </span>
                        {formatRecipeQuantity(it.recipeQuantities) && (
                          <span className="shrink-0 text-xs font-medium text-slate-400">
                            • {formatRecipeQuantity(it.recipeQuantities)}
                          </span>
                        )}
                      </div>
                      {(it.brand || recipesUsing(it).length > 0) && (
                        <p className="truncate text-xs text-slate-400">
                          {[it.brand, ...recipesUsing(it)].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {checkedCount > 0 && (
        <button
          onClick={finishShopping}
          className="fixed bottom-20 left-1/2 z-10 flex w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-lg sm:bottom-4 lg:max-w-3xl"
        >
          <CheckIcon className="h-4 w-4" />
          Terminer les courses ({checkedCount}/{storeItems.length})
        </button>
      )}

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
        <ShoppingListPrintable ref={printableRef} store={activeStore} items={storeItems} />
      </div>

      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 px-6">
          <div className="celebration-card relative flex flex-col items-center gap-3 rounded-3xl bg-white px-10 py-8 text-center shadow-xl">
            {celebration.particles.map((p, i) => (
              <span
                key={i}
                className="celebration-particle text-2xl"
                style={
                  {
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    '--rot': `${p.rot}deg`,
                    animationDelay: `${p.delay}ms`,
                    fontSize: `${p.size}rem`
                  } as CSSProperties
                }
              >
                {p.emoji}
              </span>
            ))}
            <span className="text-5xl">🎉</span>
            <p className="text-xl font-extrabold text-brand-700">{celebration.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
