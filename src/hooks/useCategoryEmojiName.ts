import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { categoryEmojiName as defaultCategoryEmojiName } from '../data/fluentEmoji'

// Resolves a category's emoji, taking the user's Settings overrides into
// account first and falling back to the built-in default mapping.
export function useCategoryEmojiName() {
  const overrides = useAppStore((s) => s.categoryEmojiOverrides)
  return useCallback((category: string) => overrides[category] || defaultCategoryEmojiName(category), [overrides])
}
