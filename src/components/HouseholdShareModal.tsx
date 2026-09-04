import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import Modal from './Modal'
import { buildJoinLink } from '../lib/household'
import { CheckIcon, CopyIcon } from './icons'

export default function HouseholdShareModal({
  code,
  name,
  onClose
}: {
  code: string
  name: string
  onClose: () => void
}) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const link = buildJoinLink(code)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(link, { width: 240, margin: 1 }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [link])

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Modal title={`Inviter au foyer « ${name} »`} onClose={onClose}>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code d'invitation au foyer"
            className="h-56 w-56 rounded-xl border border-slate-100 dark:border-white/5"
          />
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">Scanne ce code, ou partage le lien :</p>
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-2 rounded-full border border-brand-300 px-4 py-2 text-sm font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40"
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
          {copied ? 'Lien copié !' : 'Copier le lien'}
        </button>
        <p className="text-xs text-slate-400">
          Ou donne simplement le code <span className="font-bold text-slate-600 dark:text-slate-300">{code}</span>
        </p>
      </div>
    </Modal>
  )
}
