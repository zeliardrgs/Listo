import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { categoryColor } from '../data/categoryColors'

// Resolves a category's color, taking the user's Settings overrides into
// account first and falling back to the built-in default mapping.
export function useCategoryColor() {
  const overrides = useAppStore((s) => s.categoryColorOverrides)
  return useCallback((category: string) => categoryColor(category, overrides), [overrides])
}
