import type { PlanningItem, Recipe, ShoppingItem, StoreIconValue } from '../types'

// Settings-ish fields, shared within a household as one small document since
// they change rarely and concurrent edits are unlikely. Everything else
// (items, recipes, planning) syncs as one Firestore document per entity —
// see collectionSync.ts — so two people editing different things offline
// never clobber each other.
export interface SharedConfig {
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
}

const CONFIG_KEYS: (keyof SharedConfig)[] = [
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
  'defaultStore'
]

export function pickConfig<T extends SharedConfig>(state: T): SharedConfig {
  const out = {} as Record<string, unknown>
  CONFIG_KEYS.forEach((key) => {
    out[key] = state[key]
  })
  return out as unknown as SharedConfig
}

export function emptyConfig(): SharedConfig {
  return {
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
    defaultStore: ''
  }
}

// Every field of the app store that's shared within a household in some
// form (either via the config doc or a per-entity collection). Used to
// blank the local store when switching households, so one household's data
// never lingers or leaks into another before its own data has loaded.
export interface SyncedAppData extends SharedConfig {
  items: ShoppingItem[]
  recipes: Recipe[]
  planningQueue: PlanningItem[]
  planningSlots: Record<string, PlanningItem[]>
  planningNotes: Record<string, string>
}

export function emptySyncedAppData(): SyncedAppData {
  return {
    ...emptyConfig(),
    items: [],
    recipes: [],
    planningQueue: [],
    planningSlots: {},
    planningNotes: {}
  }
}
