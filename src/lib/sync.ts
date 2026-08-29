import type { PlanningItem, Recipe, ShoppingItem, StoreIconValue } from '../types'

// The slice of the app store that's shared within a household. Notably
// excludes `listSortMode`, which is a per-device UI preference.
export interface SyncableState {
  items: ShoppingItem[]
  recipes: Recipe[]
  customCategories: string[]
  customStores: string[]
  customBrands: string[]
  customTags: string[]
  removedDefaultStores: string[]
  removedDefaultCategories: string[]
  removedDefaultTags: string[]
  categoryEmojiOverrides: Record<string, string>
  categoryColorOverrides: Record<string, string>
  storeIconOverrides: Record<string, StoreIconValue>
  defaultStore: string
  planningQueue: PlanningItem[]
  planningSlots: Record<string, PlanningItem[]>
  planningNotes: Record<string, string>
}

const SYNCABLE_KEYS: (keyof SyncableState)[] = [
  'items',
  'recipes',
  'customCategories',
  'customStores',
  'customBrands',
  'customTags',
  'removedDefaultStores',
  'removedDefaultCategories',
  'removedDefaultTags',
  'categoryEmojiOverrides',
  'categoryColorOverrides',
  'storeIconOverrides',
  'defaultStore',
  'planningQueue',
  'planningSlots',
  'planningNotes'
]

export function pickSyncable<T extends SyncableState>(state: T): SyncableState {
  const out = {} as Record<string, unknown>
  SYNCABLE_KEYS.forEach((key) => {
    out[key] = state[key]
  })
  return out as unknown as SyncableState
}

// Used when switching the active household (including to none), so a
// previous household's data never lingers or leaks into another one.
export function emptySyncableState(): SyncableState {
  return {
    items: [],
    recipes: [],
    customCategories: [],
    customStores: [],
    customBrands: [],
    customTags: [],
    removedDefaultStores: [],
    removedDefaultCategories: [],
    removedDefaultTags: [],
    categoryEmojiOverrides: {},
    categoryColorOverrides: {},
    storeIconOverrides: {},
    defaultStore: '',
    planningQueue: [],
    planningSlots: {},
    planningNotes: {}
  }
}
