import { useState } from 'react'
import Modal from './Modal'
import { SOLID_UNITS, LIQUID_UNITS } from '../data/constants'
import type { Unit } from '../types'

export default function QuantityModal({
  itemName,
  initialQuantity,
  initialUnit,
  onClose,
  onSave
}: {
  itemName: string
  initialQuantity?: number
  initialUnit?: Unit
  onClose: () => void
  onSave: (quantity: number | undefined, unit: Unit | undefined, keepAsDefault: boolean) => void
}) {
  const [quantity, setQuantity] = useState(initialQuantity != null ? String(initialQuantity) : '')
  const [unit, setUnit] = useState<Unit | ''>(initialUnit ?? '')
  const [keepAsDefault, setKeepAsDefault] = useState(false)

  function save(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = quantity.trim()
    onSave(trimmed === '' ? undefined : Number(trimmed), unit === '' ? undefined : unit, keepAsDefault)
    onClose()
  }

  return (
    <Modal title={`Ajuster la quantité — ${itemName}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div className="flex gap-2">
          <input
            autoFocus
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantité"
            className="w-24 shrink-0 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit | '')}
            className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#241c15] px-2 py-2 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">Unité</option>
            <optgroup label="Solide">
              {SOLID_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </optgroup>
            <optgroup label="Liquide">
              {LIQUID_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={keepAsDefault}
            onChange={(e) => setKeepAsDefault(e.target.checked)}
            className="check-lg rounded"
          />
          Conserver la quantité pour les prochaines fois
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            Annuler
          </button>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
            Valider
          </button>
        </div>
      </form>
    </Modal>
  )
}
