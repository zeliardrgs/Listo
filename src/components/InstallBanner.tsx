import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import Modal from './Modal'
import { ShareIcon, CrossIcon } from './icons'

const DISMISS_KEY = 'listo-install-banner-dismissed'

export default function InstallBanner() {
  const { installed, canPromptDirectly, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [showHelp, setShowHelp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  if (installed || dismissed) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleInstallClick() {
    if (!canPromptDirectly) {
      setShowHelp(true)
      return
    }
    setBusy(true)
    try {
      const outcome = await promptInstall()
      showToast(outcome === 'accepted' ? 'Installation en cours…' : 'Installation annulée')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 bg-brand-50 px-3 py-2 sm:hidden">
        <span className="flex-1 text-xs font-semibold text-brand-700">
          📲 Installe Listo sur ton écran d'accueil pour une vraie expérience d'application
        </span>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={busy}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-70"
        >
          {busy && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {busy ? 'Installation…' : 'Installer'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          title="Ne plus afficher"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-400 hover:bg-brand-100"
        >
          <CrossIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:hidden">
          <div className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">{toast}</div>
        </div>
      )}

      {showHelp && (
        <Modal title="Installer Listo" onClose={() => setShowHelp(false)}>
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="mb-1 flex items-center gap-1.5 font-bold text-brand-700">
                <ShareIcon className="h-4 w-4" />
                Sur iPhone (Safari)
              </p>
              <p>
                Appuie sur le bouton <strong>Partager</strong> (le carré avec la flèche vers le haut, en bas de
                l'écran), puis choisis <strong>« Sur l'écran d'accueil »</strong>.
              </p>
            </div>
            <div>
              <p className="mb-1 font-bold text-brand-700">Sur Android (Chrome)</p>
              <p>
                Appuie sur le menu <strong>⋮</strong> en haut à droite, puis choisis{' '}
                <strong>« Installer l'application »</strong> (ou « Ajouter à l'écran d'accueil »).
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
