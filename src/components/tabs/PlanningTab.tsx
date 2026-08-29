import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DAYS_OF_WEEK, MEAL_SLOTS } from '../../data/constants'
import { exportListAsImage } from '../../utils/exportList'
import { buildPlanningText, copyPlanningToClipboard, planningKey, type PlanningWeekBlock } from '../../utils/exportPlanning'
import PlanningQueueRow from '../PlanningQueueRow'
import PlanningCell from '../PlanningCell'
import PlanningPrintable from '../PlanningPrintable'
import { ImageIcon, CopyIcon, CrossIcon, TrashIcon } from '../icons'
import type { ShoppingItem } from '../../types'

type ViewMode = '4d' | '1w' | '2w'

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: '4d', label: '4 Jours' },
  { key: '1w', label: '1 semaine' },
  { key: '2w', label: '2 semaines' }
]

function todayIndex(): number {
  const jsDay = new Date().getDay()
  return jsDay === 0 ? 6 : jsDay - 1
}

function buildWeekBlocks(viewMode: ViewMode): PlanningWeekBlock[] {
  if (viewMode === '4d') {
    const start = todayIndex()
    const days = Array.from({ length: 4 }, (_, i) => DAYS_OF_WEEK[(start + i) % 7])
    return [{ week: 'w1', label: 'Semaine 1', days }]
  }
  if (viewMode === '2w')
    return [
      { week: 'w1', label: 'Semaine 1', days: [...DAYS_OF_WEEK] },
      { week: 'w2', label: 'Semaine 2', days: [...DAYS_OF_WEEK] }
    ]
  return [{ week: 'w1', label: 'Semaine 1', days: [...DAYS_OF_WEEK] }]
}

interface Toast {
  message: string
  snapshot?: ShoppingItem[]
}

export default function PlanningTab() {
  const recipes = useAppStore((s) => s.recipes)
  const planningQueue = useAppStore((s) => s.planningQueue)
  const planningSlots = useAppStore((s) => s.planningSlots)
  const planningNotes = useAppStore((s) => s.planningNotes)
  const removeFromPlanningQueue = useAppStore((s) => s.removeFromPlanningQueue)
  const clearPlanningQueue = useAppStore((s) => s.clearPlanningQueue)
  const placeInPlanningSlot = useAppStore((s) => s.placeInPlanningSlot)
  const removeFromPlanningSlot = useAppStore((s) => s.removeFromPlanningSlot)
  const returnToPlanningQueue = useAppStore((s) => s.returnToPlanningQueue)
  const clearPlanning = useAppStore((s) => s.clearPlanning)
  const setPlanningNote = useAppStore((s) => s.setPlanningNote)
  const addIngredientsToList = useAppStore((s) => s.addIngredientsToList)
  const replaceItems = useAppStore((s) => s.replaceItems)

  const [viewMode, setViewMode] = useState<ViewMode>('1w')
  const [queueDragOver, setQueueDragOver] = useState(false)
  const [armedItemId, setArmedItemId] = useState<string | null>(null)
  const [confirmClearPlanning, setConfirmClearPlanning] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const printableRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const recipesById = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes])
  const weekBlocks = useMemo(() => buildWeekBlocks(viewMode), [viewMode])
  const totalColumns = weekBlocks.reduce((n, b) => n + b.days.length, 0)
  const columnTemplate = viewMode === '2w' ? 'minmax(120px, 1fr)' : 'minmax(104px, 1fr)'
  const hasPlanningContent =
    Object.values(planningSlots).some((list) => list.length > 0) || Object.keys(planningNotes).length > 0

  function showToast(message: string, snapshot?: ShoppingItem[]) {
    clearTimeout(toastTimer.current)
    setToast({ message, snapshot })
    toastTimer.current = setTimeout(() => setToast(null), snapshot ? 6000 : 2200)
  }

  function undoToast() {
    if (!toast?.snapshot) return
    replaceItems(toast.snapshot)
    clearTimeout(toastTimer.current)
    setToast(null)
  }

  function handleAddAllToList() {
    const snapshot = useAppStore.getState().items
    let count = 0
    weekBlocks.forEach((block) => {
      block.days.forEach((day) => {
        MEAL_SLOTS.forEach((slot) => {
          const key = planningKey(block.week, day, slot)
          ;(planningSlots[key] || []).forEach((item) => {
            const recipe = recipesById.get(item.recipeId)
            if (recipe) {
              addIngredientsToList(recipe.id)
              count++
            }
          })
        })
      })
    })
    if (count > 0) showToast(`Ingrédients de ${count} repas ajoutés à la liste`, snapshot)
    else showToast('Aucune recette planifiée pour le moment')
  }

  function handleClearPlanning() {
    if (!confirmClearPlanning) {
      setConfirmClearPlanning(true)
      return
    }
    clearPlanning()
    setConfirmClearPlanning(false)
  }

  async function handleExportImage() {
    if (!printableRef.current) return
    try {
      await exportListAsImage(printableRef.current, 'planning.png')
      showToast('Image exportée')
    } catch {
      showToast("Échec de l'export image")
    }
  }

  async function handleCopyText() {
    try {
      await copyPlanningToClipboard(buildPlanningText(weekBlocks, planningSlots, planningNotes, recipesById))
      showToast('Planning copié dans le presse-papiers')
    } catch {
      showToast('Impossible de copier le planning')
    }
  }

  return (
    <div className="mx-auto max-w-[1800px] px-3 pt-4 pb-10 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <aside className="w-full sm:w-72 sm:shrink-0">
          <div className="mb-2 rounded-2xl bg-[#FFF1DC] px-4 py-3">
            <h3 className="text-sm font-extrabold text-brand-700">Recettes</h3>
          </div>
          {planningQueue.length > 0 && (
            <p className="mb-2 text-xs text-slate-400 sm:hidden">
              Touche une recette puis touche un créneau pour la placer.
            </p>
          )}
          <ul
            onDragOver={(e) => {
              e.preventDefault()
              setQueueDragOver(true)
            }}
            onDragLeave={() => setQueueDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setQueueDragOver(false)
              const id = e.dataTransfer.getData('text/plain')
              if (id) returnToPlanningQueue(id)
            }}
            className={`space-y-2 rounded-xl p-1 transition-colors ${
              queueDragOver ? 'bg-brand-50 ring-2 ring-inset ring-brand-300' : ''
            }`}
          >
            {planningQueue.map((item) => {
              const recipe = recipesById.get(item.recipeId)
              if (!recipe) return null
              return (
                <PlanningQueueRow
                  key={item.id}
                  itemId={item.id}
                  recipe={recipe}
                  armed={armedItemId === item.id}
                  onSelect={() => setArmedItemId((id) => (id === item.id ? null : item.id))}
                  onRemove={() => removeFromPlanningQueue(item.id)}
                />
              )
            })}
            {planningQueue.length === 0 && (
              <p className="py-3 text-center text-xs text-slate-400">
                Utilise « Planifier » sur une recette pour l'ajouter ici, ou dépose ici une recette du planning.
              </p>
            )}
          </ul>
          {planningQueue.length > 0 && (
            <button
              type="button"
              onClick={clearPlanningQueue}
              className="mt-3 w-full text-center text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Vider la liste
            </button>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-col gap-2 rounded-2xl bg-[#FFF1DC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-extrabold text-brand-700">Planning</h3>
            <div className="flex flex-wrap items-center gap-3">
              {VIEW_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setViewMode(m.key)}
                  className={
                    viewMode === m.key
                      ? 'rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white'
                      : 'px-1 text-xs font-bold text-brand-600 hover:text-brand-700'
                  }
                >
                  {m.label}
                </button>
              ))}
              {hasPlanningContent && (
                <button
                  type="button"
                  onClick={handleClearPlanning}
                  onBlur={() => setConfirmClearPlanning(false)}
                  title={confirmClearPlanning ? 'Cliquer à nouveau pour confirmer' : 'Vider le planning'}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    confirmClearPlanning ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'
                  }`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  {confirmClearPlanning ? 'Confirmer ?' : 'Vider le planning'}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
            <div
              className="grid w-full bg-white"
              style={{ gridTemplateColumns: `56px repeat(${totalColumns}, ${columnTemplate})` }}
            >
              {weekBlocks.length > 1 && (
                <>
                  <div className="border-b border-r border-brand-50" />
                  {weekBlocks.map((block) => (
                    <div
                      key={block.week}
                      style={{ gridColumn: `span ${block.days.length}` }}
                      className="border-b border-r border-brand-50 bg-brand-50/50 px-2 py-1.5 text-center text-xs font-extrabold text-brand-700 last:border-r-0"
                    >
                      {block.label}
                    </div>
                  ))}
                </>
              )}

              <div className="border-b border-r border-brand-50" />
              {weekBlocks.flatMap((block) =>
                block.days.map((day) => (
                  <div
                    key={`${block.week}-${day}`}
                    className="border-b border-r border-brand-50 px-2 py-2 text-center text-xs font-extrabold text-brand-700 last:border-r-0"
                  >
                    {day}
                  </div>
                ))
              )}

              {MEAL_SLOTS.map((slot) => (
                <div key={slot} className="contents">
                  <div className="flex items-center justify-center border-b border-r border-brand-50 px-1 py-2 text-center text-[11px] font-bold text-slate-400 last:border-b-0">
                    {slot}
                  </div>
                  {weekBlocks.flatMap((block) =>
                    block.days.map((day) => {
                      const key = planningKey(block.week, day, slot)
                      return (
                        <div key={key} className="border-b border-r border-brand-50 last:border-r-0">
                          <PlanningCell
                            items={planningSlots[key] || []}
                            note={planningNotes[key]}
                            recipesById={recipesById}
                            armed={!!armedItemId}
                            onDropItem={(itemId) => placeInPlanningSlot(itemId, block.week, day, slot)}
                            onTapPlace={() => {
                              if (!armedItemId) return
                              placeInPlanningSlot(armedItemId, block.week, day, slot)
                              setArmedItemId(null)
                            }}
                            onRemoveItem={(itemId) => removeFromPlanningSlot(block.week, day, slot, itemId)}
                            onSetNote={(note) => setPlanningNote(block.week, day, slot, note)}
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddAllToList}
              className="flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6" />
              </svg>
              Tout ajouter à la liste de course
            </button>
            <div className="flex-1" />
            <button
              onClick={handleExportImage}
              className="flex items-center gap-1.5 rounded-full border border-brand-300 bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50"
            >
              <ImageIcon className="h-4 w-4" />
              Télécharger Image
            </button>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-full border border-brand-300 bg-white px-4 py-2.5 text-sm font-bold text-brand-600 shadow-sm hover:bg-brand-50"
            >
              <CopyIcon className="h-4 w-4" />
              Copier texte
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-6">
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

      <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
        <PlanningPrintable ref={printableRef} weekBlocks={weekBlocks} slots={planningSlots} notes={planningNotes} recipesById={recipesById} />
      </div>
    </div>
  )
}
