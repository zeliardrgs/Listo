import { useEffect, useState } from 'react'
import { consumeJoinCodeFromUrl, fetchHouseholdName } from '../lib/household'
import { useHouseholdStore } from '../store/useHouseholdStore'
import Modal from './Modal'

// Picks up a `?join=CODE` link (from a shared invite link or QR code) on
// load, and asks for confirmation before actually joining.
export default function JoinInvite() {
  const households = useHouseholdStore((s) => s.households)
  const addHousehold = useHouseholdStore((s) => s.addHousehold)
  const switchTo = useHouseholdStore((s) => s.switchTo)
  const [pending, setPending] = useState<{ code: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = consumeJoinCodeFromUrl()
    if (!code) return
    fetchHouseholdName(code).then((name) => {
      if (name == null) setError(`Foyer introuvable pour le code ${code}.`)
      else setPending({ code, name })
    })
  }, [])

  if (!pending && !error) return null

  function confirm() {
    if (!pending) return
    const known = households.find((h) => h.code === pending.code)
    if (known) switchTo(known.code)
    else addHousehold(pending)
    setPending(null)
  }

  function dismiss() {
    setPending(null)
    setError(null)
  }

  return (
    <Modal title="Invitation à un foyer" onClose={dismiss}>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="space-y-4 py-2 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Tu as été invité à rejoindre le foyer <span className="font-bold text-brand-700 dark:text-brand-300">« {pending?.name} »</span>.
          </p>
          <button
            type="button"
            onClick={confirm}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Rejoindre ce foyer
          </button>
        </div>
      )}
    </Modal>
  )
}
