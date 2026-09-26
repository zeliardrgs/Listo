import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import RecipeSteps from './RecipeSteps'
import { CheckIcon, CrossIcon } from './icons'
import { pluralizeUnit } from '../utils/pluralizeUnit'
import type { RecipeIngredient } from '../types'

type WakeLockNavigator = Navigator & {
  wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> }
}

// Keeps the screen from going to sleep while cooking, where supported.
function useScreenWakeLock() {
  useEffect(() => {
    let lock: { release(): Promise<void> } | null = null
    let cancelled = false
    async function request() {
      try {
        const next = await (navigator as WakeLockNavigator).wakeLock?.request('screen')
        if (cancelled) next?.release().catch(() => {})
        else lock = next ?? null
      } catch {
        // Not supported or refused (e.g. low battery): cooking mode still works.
      }
    }
    request()
    // The lock is dropped whenever the tab is hidden; take it again on return.
    function onVisibility() {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])
}

export default function CookingMode({
  name,
  ingredients,
  factor,
  steps,
  onClose
}: {
  name: string
  ingredients: RecipeIngredient[]
  factor: number
  steps: string[]
  onClose: () => void
}) {
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const [doneIngredients, setDoneIngredients] = useState<Set<string>>(new Set())
  useScreenWakeLock()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-cream dark:bg-[#2a1b4d]">
      <div className="flex shrink-0 items-center gap-3 bg-brand-600 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-8">
        <p className="min-w-0 flex-1 truncate text-lg font-extrabold text-white sm:text-xl">{name}</p>
        <button
          type="button"
          onClick={onClose}
          title="Quitter le mode cuisine"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
        >
          <CrossIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-8 lg:flex-row lg:gap-12">
          {ingredients.length > 0 && (
            <section className="lg:sticky lg:top-6 lg:w-72 lg:shrink-0 lg:self-start">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Ingrédients</h2>
              <ul className="space-y-1.5">
                {ingredients.map((ing) => {
                  const qty = ing.quantity != null ? Math.round(ing.quantity * factor * 100) / 100 : undefined
                  const isDone = doneIngredients.has(ing.id)
                  return (
                    <li key={ing.id}>
                      <button
                        type="button"
                        onClick={() => setDoneIngredients((s) => toggle(s, ing.id))}
                        className="flex w-full items-center gap-3 rounded-xl bg-white dark:bg-[#5b3d94] px-3 py-2.5 text-left shadow-sm"
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                            isDone ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {isDone && <CheckIcon className="h-3.5 w-3.5" />}
                        </span>
                        <span className={`min-w-0 flex-1 text-base ${isDone ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                          <span className="font-bold">{ing.name}</span>
                          {qty != null && (
                            <span className="ml-1.5 text-slate-400">
                              {qty} {pluralizeUnit(ing.unit, qty)}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="min-w-0 flex-1">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">Étapes</h2>
            <RecipeSteps steps={steps} size="large" done={doneSteps} onToggle={(i) => setDoneSteps((s) => toggle(s, i))} />
            {steps.length > 0 && (
              <p className="mt-6 text-center text-xs text-slate-400">Touche une étape pour la marquer comme faite.</p>
            )}
          </section>
        </div>
      </div>
    </div>,
    document.body
  )
}
