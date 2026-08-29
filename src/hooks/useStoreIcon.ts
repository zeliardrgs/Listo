import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { DEFAULT_STORE_EMOJI } from '../data/fluentEmoji'
import type { StoreIconValue } from '../types'

const DEFAULT_ICON: StoreIconValue = { type: 'emoji', value: DEFAULT_STORE_EMOJI }

// Resolves a store's icon (emoji or custom image), taking the user's
// Settings overrides into account first and falling back to a generic default.
export function useStoreIcon() {
  const overrides = useAppStore((s) => s.storeIconOverrides)
  return useCallback((store: string): StoreIconValue => overrides[store] || DEFAULT_ICON, [overrides])
}
