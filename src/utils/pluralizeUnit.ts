import type { Unit } from '../types'

const INVARIABLE_UNITS = new Set<Unit>(['g', 'kg', 'ml', 'cl', 'l'])

export function pluralizeUnit(unit: Unit | undefined, quantity: number | undefined): string {
  if (!unit) return ''
  if (INVARIABLE_UNITS.has(unit)) return unit
  return quantity != null && Math.abs(quantity) > 1 ? `${unit}s` : unit
}
