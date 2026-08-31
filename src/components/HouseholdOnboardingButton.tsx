import { useState } from 'react'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { createHousehold, fetchHouseholdName } from '../lib/household'
import { HomeIcon } from './icons'
import Modal from './Modal'

export default function HouseholdOnboardingButton() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  const households = useHouseholdStore((s) => s.households)
  const addHousehold = useHouseholdStore((s) => s.addHousehold)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [nameDraft, setNameDraft] = useState('')
  const [codeDraft, setCodeDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (activeCode || households.length > 0) return null

  function close() {
    setOpen(false)
    setMode('create')
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
      close()
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
      close()
    } catch {
      setError('Impossible de vérifier ce code, vérifie ta connexion.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Créer ou rejoindre un foyer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
      >
        <HomeIcon className="h-5 w-5" />
      </button>

      {open && (
        <Modal title="Créer ou rejoindre un foyer" onClose={close}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Un foyer te permet de partager ta liste de courses et tes recettes avec d'autres personnes.
            </p>

            <div className="flex w-fit gap-1 rounded-full bg-slate-100 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`rounded-full px-3 py-1.5 ${mode === 'create' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setMode('join')}
                className={`rounded-full px-3 py-1.5 ${mode === 'join' ? 'bg-white text-brand-700 shadow' : 'text-slate-500'}`}
              >
                Rejoindre
              </button>
            </div>

            {mode === 'create' ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Nom du foyer"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={busy}
                  className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? 'Création…' : 'Créer'}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={codeDraft}
                  onChange={(e) => setCodeDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Code du foyer"
                  maxLength={6}
                  className="w-32 shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-bold uppercase tracking-widest focus:border-brand-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={busy || !codeDraft.trim()}
                  className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? 'Vérification…' : 'Rejoindre'}
                </button>
              </div>
            )}

            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
          </div>
        </Modal>
      )}
    </>
  )
}
