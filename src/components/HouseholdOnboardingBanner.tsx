import { useState } from 'react'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { createHousehold, fetchHouseholdName } from '../lib/household'
import { CrossIcon } from './icons'

const DISMISS_KEY = 'listo-household-onboarding-dismissed'

export default function HouseholdOnboardingBanner() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  const households = useHouseholdStore((s) => s.households)
  const addHousehold = useHouseholdStore((s) => s.addHousehold)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle')
  const [nameDraft, setNameDraft] = useState('')
  const [codeDraft, setCodeDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (dismissed || activeCode || households.length > 0) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  function reset() {
    setMode('idle')
    setNameDraft('')
    setCodeDraft('')
    setError(null)
  }

  async function handleCreate() {
    setBusy(true)
    setError(null)
    try {
      const code = await createHousehold(nameDraft)
      addHousehold({ code, name: nameDraft.trim() || code })
      reset()
    } catch {
      setError('Impossible de créer le foyer, vérifie ta connexion.')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    const code = codeDraft.trim().toUpperCase()
    if (!code) return
    setBusy(true)
    setError(null)
    try {
      const name = await fetchHouseholdName(code)
      if (name == null) {
        setError('Code introuvable, vérifie-le.')
        return
      }
      addHousehold({ code, name })
      reset()
    } catch {
      setError('Impossible de vérifier ce code, vérifie ta connexion.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border-b border-brand-100 bg-brand-50 px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-start gap-2">
        <div className="min-w-0 flex-1">
          {mode === 'idle' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-brand-700 sm:text-sm">
                🏠 Aucun foyer connecté — crée-en un ou rejoins celui de tes proches pour partager les courses.
              </span>
              <button
                type="button"
                onClick={() => setMode('create')}
                className="shrink-0 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white hover:bg-brand-700"
              >
                Créer un foyer
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className="shrink-0 rounded-full border border-brand-300 px-3 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100"
              >
                Rejoindre
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Nom du foyer"
                className="min-w-0 flex-1 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none sm:flex-none sm:w-48"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? 'Création…' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-xs font-semibold text-brand-500 hover:text-brand-700"
              >
                Annuler
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Code du foyer"
                maxLength={6}
                className="w-32 shrink-0 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-center text-sm font-bold uppercase tracking-widest focus:border-brand-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy || !codeDraft.trim()}
                className="shrink-0 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? 'Vérification…' : 'Rejoindre'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="shrink-0 text-xs font-semibold text-brand-500 hover:text-brand-700"
              >
                Annuler
              </button>
            </div>
          )}

          {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
        </div>

        <button
          type="button"
          onClick={dismiss}
          title="Ne plus afficher"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-400 hover:bg-brand-100"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
