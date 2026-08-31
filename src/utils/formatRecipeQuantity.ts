import type { RecipeQuantityContribution, Unit } from '../types'
import { pluralizeUnit } from './pluralizeUnit'

// Sums contributions that share a unit, and joins differing units side by
// side (e.g. two recipes wanting grated cheese "in grams" and "in slices").
export function formatRecipeQuantity(contributions?: RecipeQuantityContribution[]): string {
  if (!contributions || contributions.length === 0) return ''
  const withQty = contributions.filter((c) => c.quantity != null)
  if (withQty.length === 0) return ''

  const byUnit = new Map<string, number>()
  withQty.forEach((c) => {
    const key = c.unit || ''
    byUnit.set(key, (byUnit.get(key) || 0) + (c.quantity as number))
  })

  return Array.from(byUnit.entries())
    .map(([unit, qty]) => {
      const rounded = Math.round(qty * 100) / 100
      return unit ? `${rounded} ${pluralizeUnit(unit as Unit, rounded)}` : `${rounded}`
    })
    .join(' + ')
}
