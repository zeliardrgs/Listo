import { useState } from 'react'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { createHousehold, fetchHouseholdName } from '../lib/household'
import ListoLogo from './ListoLogo'
import createCat from '../assets/household-create-cat.png'
import joinCats from '../assets/household-join-cats.png'
import tagShape from '../assets/household-tag-shape.png'

// Blocks the app until a household is active. Listo's shopping list and
// recipes only make sense shared with a household, so unlike the old
// dismissible prompt, this one can't be closed without creating or joining
// one — there's no "solo, no household" mode.
export default function HouseholdRequiredGate() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  const households = useHouseholdStore((s) => s.households)
  const addHousehold = useHouseholdStore((s) => s.addHousehold)
  const [nameDraft, setNameDraft] = useState('')
  const [codeDraft, setCodeDraft] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showCodeHelp, setShowCodeHelp] = useState(false)

  if (activeCode || households.length > 0) return null

  async function handleCreate() {
    if (!nameDraft.trim()) return
    setBusy('create')
    setCreateError(null)
    try {
      const code = await createHousehold(nameDraft)
      addHousehold({ code, name: nameDraft.trim() || code })
    } catch {
      setCreateError('Impossible de créer le foyer, vérifie ta connexion.')
    } finally {
      setBusy(null)
    }
  }

  async function handleJoin() {
    const code = codeDraft.trim().toUpperCase()
    if (!code) return
    setBusy('join')
    setJoinError(null)
    try {
      const name = await fetchHouseholdName(code)
      if (name == null) {
        setJoinError('Code introuvable, vérifie-le.')
        return
      }
      addHousehold({ code, name })
    } catch {
      setJoinError('Impossible de vérifier ce code, vérifie ta connexion.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/60 px-4 py-10">
      <div className="relative w-full max-w-3xl">
        <div
          className="absolute left-1/2 top-0 h-[51px] w-[104px] -translate-x-1/2 -translate-y-[calc(100%-3px)] bg-[#FFF1DC]"
          style={{
            WebkitMaskImage: `url(${tagShape})`,
            maskImage: `url(${tagShape})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center'
          }}
        />

        <div className="max-h-[85vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="bg-[#FFF1DC] px-6 py-6 text-center">
            <p className="flex flex-wrap items-center justify-center gap-2 text-xl font-extrabold text-brand-800 sm:text-2xl">
              Bienvenue sur <ListoLogo className="h-[2.94rem] w-auto sm:h-[3.43rem]" color="#f5841f" />
            </p>
          </div>

          <div className="px-5 py-6 sm:px-10 sm:py-8">
            <p className="mb-6 text-center text-sm text-slate-500">
              Afin de commencer, vous devez créer ou rejoindre un foyer
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col rounded-2xl bg-[#FFF8EE] px-5 py-6 text-center">
                <h2 className="mb-3 text-sm font-extrabold text-brand-700">Créer un foyer</h2>
                <img src={createCat} alt="" className="mx-auto mb-4 h-24 w-24" />
                <div className="mt-auto">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !busy && handleCreate()}
                    placeholder="Nom de votre foyer"
                    className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm focus:border-brand-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={busy === 'create' || !nameDraft.trim()}
                    className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                  >
                    {busy === 'create' ? 'Création…' : 'Créer'}
                  </button>
                  {createError && <p className="mt-2 text-xs font-semibold text-red-500">{createError}</p>}
                </div>
              </div>

              <div className="flex flex-col rounded-2xl bg-[#FFF8EE] px-5 py-6 text-center">
                <h2 className="mb-3 text-sm font-extrabold text-brand-700">Rejoindre un foyer</h2>
                <img src={joinCats} alt="" className="mx-auto mb-4 h-[5.52rem] w-auto" />
                <div className="mt-auto">
                  <div className="mb-3 flex gap-2">
                    <input
                      value={codeDraft}
                      onChange={(e) => setCodeDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !busy && handleJoin()}
                      placeholder="Code du foyer"
                      maxLength={6}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm focus:border-brand-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={busy === 'join' || !codeDraft.trim()}
                      className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      {busy === 'join' ? 'Vérif…' : 'Rejoindre'}
                    </button>
                  </div>
                  {joinError && <p className="mt-2 text-xs font-semibold text-red-500">{joinError}</p>}
                  <button
                    type="button"
                    onClick={() => setShowCodeHelp((v) => !v)}
                    className="mt-2 text-xs font-semibold text-brand-600 underline decoration-dotted hover:text-brand-700"
                  >
                    Ou trouver ce code ?
                  </button>
                  {showCodeHelp && (
                    <p className="mt-2 text-xs text-slate-500">
                      Demande-le à quelqu'un déjà dans le foyer : le code est affiché dans ses Paramètres, sous «
                      Foyer actif ».
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
