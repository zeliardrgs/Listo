import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  PlanningItem,
  Recipe,
  RecipeIngredient,
  RecipeQuantityContribution,
  ShoppingItem,
  StoreIconValue,
  Unit
} from '../types'
import {
  CATEGORIES,
  DAYS_OF_WEEK,
  DEFAULT_STORES,
  MAX_PER_PLANNING_SLOT,
  RECIPE_TAGS,
  type DayOfWeek,
  type MealSlot,
  type PlanningWeek
} from '../data/constants'

function planningKey(week: PlanningWeek, day: DayOfWeek, slot: MealSlot) {
  return `${week}__${day}__${slot}`
}

function pickDefaultStore(s: { defaultStore: string; customStores: string[]; removedDefaultStores: string[] }): string {
  if (s.defaultStore) {
    const known = (DEFAULT_STORES as readonly string[]).includes(s.defaultStore) || s.customStores.includes(s.defaultStore)
    if (known && !s.removedDefaultStores.includes(s.defaultStore)) return s.defaultStore
  }
  return s.customStores[0] || DEFAULT_STORES[0]
}

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Replaces one recipe's prior contribution to an item (its quantities
// changed, or it's being re-added) while leaving other recipes' untouched.
function mergeRecipeQuantities(
  existing: RecipeQuantityContribution[] | undefined,
  incoming: RecipeQuantityContribution[] | undefined
): RecipeQuantityContribution[] | undefined {
  if (!incoming || incoming.length === 0) return existing
  const byRecipe = new Map((existing || []).map((c) => [c.recipeId, c] as const))
  incoming.forEach((c) => byRecipe.set(c.recipeId, c))
  return Array.from(byRecipe.values())
}

interface AppStore {
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
  listSortMode: 'name' | 'store' | 'category'
  planningQueue: PlanningItem[]
  planningSlots: Record<string, PlanningItem[]>
  planningNotes: Record<string, string>

  addItem: (item: Omit<ShoppingItem, 'id' | 'checked' | 'updatedAt'>) => void
  updateItem: (id: string, patch: Partial<ShoppingItem>) => void
  removeItem: (id: string) => void
  toggleChecked: (id: string) => void
  resetCheckedForStore: (store: string) => void
  replaceItems: (items: ShoppingItem[]) => void
  clearShoppingList: () => void
  clearShoppingListForStore: (store: string) => void

  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => string
  updateRecipe: (id: string, patch: Partial<Recipe>) => void
  removeRecipe: (id: string) => void
  addIngredientsToList: (recipeId: string) => void

  addToPlanningQueue: (recipeId: string) => void
  removeFromPlanningQueue: (id: string) => void
  removeRecipeFromPlanning: (recipeId: string) => void
  clearPlanningQueue: () => void
  clearPlanning: () => void
  placeInPlanningSlot: (itemId: string, week: PlanningWeek, day: DayOfWeek, slot: MealSlot) => void
  removeFromPlanningSlot: (week: PlanningWeek, day: DayOfWeek, slot: MealSlot, itemId: string) => void
  returnToPlanningQueue: (itemId: string) => void
  setPlanningNote: (week: PlanningWeek, day: DayOfWeek, slot: MealSlot, note: string) => void

  registerStore: (name: string) => void
  registerBrand: (name: string) => void
  registerCategory: (name: string) => void

  addStore: (name: string) => void
  removeStore: (name: string) => void
  renameStore: (oldName: string, newName: string) => void
  setStoreIcon: (name: string, icon: StoreIconValue) => void
  setDefaultStore: (name: string) => void
  getDefaultStore: () => string
  setListSortMode: (mode: 'name' | 'store' | 'category') => void
  addCategory: (name: string, emojiName: string) => void
  removeCategory: (name: string) => void
  renameCategory: (oldName: string, newName: string) => void
  setCategoryEmoji: (name: string, emojiName: string) => void
  setCategoryColor: (name: string, colorKey: string) => void

  addTag: (name: string) => void
  removeTag: (name: string) => void
  renameTag: (oldName: string, newName: string) => void

  allCategories: () => string[]
  allStores: () => string[]
  allBrands: () => string[]
  allTags: () => string[]
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
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
      listSortMode: 'name',
      planningQueue: [],
      planningSlots: {},
      planningNotes: {},

      addItem: (item) =>
        set((s) => {
          const dupIdx = s.items.findIndex((it) => it.name.trim().toLowerCase() === item.name.trim().toLowerCase())
          if (dupIdx === -1) {
            const store = item.store || pickDefaultStore(s)
            return { items: [...s.items, { ...item, store, id: makeId(), checked: false, updatedAt: Date.now() }] }
          }
          const existing = s.items[dupIdx]
          const merged: ShoppingItem = {
            ...existing,
            category: item.category || existing.category,
            brand: item.brand || existing.brand,
            store: item.store || existing.store,
            recurring: item.recurring || existing.recurring,
            onceOnly: item.onceOnly ?? existing.onceOnly,
            toBuy: item.toBuy || existing.toBuy,
            fromRecipes:
              item.fromRecipes && item.fromRecipes.length > 0
                ? Array.from(new Set([...(existing.fromRecipes || []), ...item.fromRecipes]))
                : item.toBuy && !existing.toBuy
                  ? undefined
                  : existing.fromRecipes,
            recipeQuantities: mergeRecipeQuantities(existing.recipeQuantities, item.recipeQuantities),
            updatedAt: Date.now()
          }
          const items = [...s.items]
          items[dupIdx] = merged
          return { items }
        }),

      updateItem: (id, patch) =>
        set((s) => {
          const current = s.items.find((it) => it.id === id)
          if (!current) return s
          const updated: ShoppingItem = { ...current, ...patch, updatedAt: Date.now() }
          if (patch.recipeQuantities !== undefined) {
            updated.recipeQuantities = mergeRecipeQuantities(current.recipeQuantities, patch.recipeQuantities)
          }

          // Manually re-adding an item to the shopping list (outside of a
          // recipe/planning quick-add, which always passes fromRecipes
          // explicitly) drops any stale recipe association from a previous
          // add, so the Courses tab doesn't keep showing it as recipe-driven.
          if (patch.toBuy === true && !current.toBuy && patch.fromRecipes === undefined) {
            updated.fromRecipes = undefined
            updated.recipeQuantities = undefined
          }

          const oldNameKey = current.name.trim().toLowerCase()
          const nameChanged = patch.name != null && updated.name.trim() !== current.name.trim()
          const categoryChanged = patch.category != null && updated.category !== current.category
          const recipes =
            nameChanged || categoryChanged
              ? s.recipes.map((r) => ({
                  ...r,
                  ingredients: r.ingredients.map((ing) =>
                    ing.name.trim().toLowerCase() === oldNameKey
                      ? {
                          ...ing,
                          name: nameChanged ? updated.name.trim() : ing.name,
                          category: categoryChanged ? updated.category : ing.category
                        }
                      : ing
                  )
                }))
              : s.recipes

          if (patch.name) {
            const dup = s.items.find(
              (it) => it.id !== id && it.name.trim().toLowerCase() === updated.name.trim().toLowerCase()
            )
            if (dup) {
              const merged: ShoppingItem = { ...dup, ...updated, id: dup.id, updatedAt: Date.now() }
              return { items: s.items.filter((it) => it.id !== id && it.id !== dup.id).concat(merged), recipes }
            }
          }

          return { items: s.items.map((it) => (it.id === id ? updated : it)), recipes }
        }),

      removeItem: (id) => set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      replaceItems: (items) => set({ items }),

      clearShoppingList: () =>
        set((s) => ({
          items: s.items.map((it) => (it.toBuy || it.checked ? { ...it, toBuy: false, checked: false } : it))
        })),

      clearShoppingListForStore: (store) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.store === store && (it.toBuy || it.checked) ? { ...it, toBuy: false, checked: false } : it
          )
        })),

      toggleChecked: (id) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
        })),

      resetCheckedForStore: (store) =>
        set((s) => ({
          items: s.items
            .filter((it) => !(it.store === store && it.checked && it.onceOnly))
            .map((it) => (it.store === store && it.checked ? { ...it, toBuy: it.recurring, checked: false } : it))
        })),

      addRecipe: (recipe) => {
        const id = makeId()
        set((s) => ({ recipes: [...s.recipes, { ...recipe, id, createdAt: Date.now() }] }))
        return id
      },

      updateRecipe: (id, patch) =>
        set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

      removeRecipe: (id) =>
        set((s) => ({
          recipes: s.recipes.filter((r) => r.id !== id),
          planningQueue: s.planningQueue.filter((i) => i.recipeId !== id),
          planningSlots: Object.fromEntries(
            Object.entries(s.planningSlots).map(([key, list]) => [key, list.filter((i) => i.recipeId !== id)])
          )
        })),

      addIngredientsToList: (recipeId) => {
        const recipe = get().recipes.find((r) => r.id === recipeId)
        if (!recipe) return
        set((s) => {
          const items = [...s.items]
          recipe.ingredients
            .filter((ing: RecipeIngredient) => !ing.inStock)
            .forEach((ing: RecipeIngredient) => {
              const contribution: RecipeQuantityContribution = { recipeId, quantity: ing.quantity, unit: ing.unit }
              const idx = items.findIndex((it) => it.name.trim().toLowerCase() === ing.name.trim().toLowerCase())
              if (idx !== -1) {
                const existing = items[idx]
                items[idx] = {
                  ...existing,
                  toBuy: true,
                  fromRecipes: Array.from(new Set([...(existing.fromRecipes || []), recipeId])),
                  recipeQuantities: mergeRecipeQuantities(existing.recipeQuantities, [contribution]),
                  updatedAt: Date.now()
                }
              } else {
                items.push({
                  id: makeId(),
                  name: ing.name,
                  category: ing.category || 'Autre',
                  brand: '',
                  store: pickDefaultStore(s),
                  recurring: false,
                  toBuy: true,
                  fromRecipes: [recipeId],
                  recipeQuantities: [contribution],
                  checked: false,
                  updatedAt: Date.now()
                })
              }
            })
          return { items }
        })
      },

      addToPlanningQueue: (recipeId) =>
        set((s) => ({ planningQueue: [...s.planningQueue, { id: makeId(), recipeId }] })),

      removeFromPlanningQueue: (id) =>
        set((s) => ({ planningQueue: s.planningQueue.filter((i) => i.id !== id) })),

      clearPlanningQueue: () => set({ planningQueue: [] }),

      removeRecipeFromPlanning: (recipeId) =>
        set((s) => ({
          planningQueue: s.planningQueue.filter((i) => i.recipeId !== recipeId),
          planningSlots: Object.fromEntries(
            Object.entries(s.planningSlots).map(([key, list]) => [key, list.filter((i) => i.recipeId !== recipeId)])
          )
        })),

      clearPlanning: () => set({ planningSlots: {}, planningNotes: {} }),

      placeInPlanningSlot: (itemId, week, day, slot) =>
        set((s) => {
          const validRecipeIds = new Set(get().recipes.map((r) => r.id))
          const key = planningKey(week, day, slot)
          const targetList = (s.planningSlots[key] || []).filter((i) => validRecipeIds.has(i.recipeId))
          if (targetList.length >= MAX_PER_PLANNING_SLOT) return s

          let item = s.planningQueue.find((i) => i.id === itemId)
          let queue = s.planningQueue
          let slots = s.planningSlots

          if (item) {
            queue = s.planningQueue.filter((i) => i.id !== itemId)
          } else {
            for (const [k, list] of Object.entries(s.planningSlots)) {
              const found = list.find((i) => i.id === itemId)
              if (found) {
                item = found
                slots = { ...slots, [k]: list.filter((i) => i.id !== itemId) }
                break
              }
            }
          }
          if (!item) return s

          return {
            planningQueue: queue,
            planningSlots: { ...slots, [key]: [...targetList, item] }
          }
        }),

      removeFromPlanningSlot: (week, day, slot, itemId) =>
        set((s) => {
          const key = planningKey(week, day, slot)
          const list = s.planningSlots[key] || []
          const item = list.find((i) => i.id === itemId)
          if (!item) return s
          return {
            planningSlots: { ...s.planningSlots, [key]: list.filter((i) => i.id !== itemId) },
            planningQueue: [...s.planningQueue, item]
          }
        }),

      returnToPlanningQueue: (itemId) =>
        set((s) => {
          if (s.planningQueue.some((i) => i.id === itemId)) return s
          for (const [key, list] of Object.entries(s.planningSlots)) {
            const found = list.find((i) => i.id === itemId)
            if (found) {
              return {
                planningSlots: { ...s.planningSlots, [key]: list.filter((i) => i.id !== itemId) },
                planningQueue: [...s.planningQueue, found]
              }
            }
          }
          return s
        }),

      setPlanningNote: (week, day, slot, note) =>
        set((s) => {
          const key = planningKey(week, day, slot)
          const trimmed = note.trim()
          const next = { ...s.planningNotes }
          if (trimmed) next[key] = trimmed
          else delete next[key]
          return { planningNotes: next }
        }),

      registerStore: (name) =>
        set((s) => (s.customStores.includes(name) || !name ? s : { customStores: [...s.customStores, name] })),
      registerBrand: (name) =>
        set((s) => (s.customBrands.includes(name) || !name ? s : { customBrands: [...s.customBrands, name] })),
      registerCategory: (name) =>
        set((s) => (s.customCategories.includes(name) || !name ? s : { customCategories: [...s.customCategories, name] })),

      addStore: (name) =>
        set((s) => {
          const trimmed = name.trim()
          if (!trimmed) return s
          return {
            removedDefaultStores: s.removedDefaultStores.filter((n) => n !== trimmed),
            customStores: s.customStores.includes(trimmed) ? s.customStores : [...s.customStores, trimmed]
          }
        }),
      removeStore: (name) =>
        set((s) => {
          const iconOverrides = { ...s.storeIconOverrides }
          delete iconOverrides[name]
          return {
            customStores: s.customStores.filter((n) => n !== name),
            removedDefaultStores: (DEFAULT_STORES as readonly string[]).includes(name)
              ? Array.from(new Set([...s.removedDefaultStores, name]))
              : s.removedDefaultStores,
            storeIconOverrides: iconOverrides,
            defaultStore: s.defaultStore === name ? '' : s.defaultStore
          }
        }),
      renameStore: (oldName, newName) =>
        set((s) => {
          const trimmed = newName.trim()
          if (!trimmed || trimmed === oldName) return s
          const isDefault = (DEFAULT_STORES as readonly string[]).includes(oldName)
          const iconOverrides = { ...s.storeIconOverrides }
          if (iconOverrides[oldName] != null) {
            iconOverrides[trimmed] = iconOverrides[oldName]
            delete iconOverrides[oldName]
          }
          return {
            customStores: isDefault
              ? s.customStores.includes(trimmed)
                ? s.customStores
                : [...s.customStores, trimmed]
              : s.customStores.map((n) => (n === oldName ? trimmed : n)),
            removedDefaultStores: (isDefault
              ? Array.from(new Set([...s.removedDefaultStores, oldName]))
              : s.removedDefaultStores
            ).filter((n) => n !== trimmed),
            storeIconOverrides: iconOverrides,
            defaultStore: s.defaultStore === oldName ? trimmed : s.defaultStore,
            items: s.items.map((it) => (it.store === oldName ? { ...it, store: trimmed, updatedAt: Date.now() } : it))
          }
        }),
      setStoreIcon: (name, icon) =>
        set((s) => ({ storeIconOverrides: { ...s.storeIconOverrides, [name]: icon } })),
      setDefaultStore: (name) => set({ defaultStore: name.trim() }),
      getDefaultStore: () => pickDefaultStore(get()),
      setListSortMode: (mode) => set({ listSortMode: mode }),

      addCategory: (name, emojiName) =>
        set((s) => {
          const trimmed = name.trim()
          if (!trimmed) return s
          return {
            removedDefaultCategories: s.removedDefaultCategories.filter((n) => n !== trimmed),
            customCategories: s.customCategories.includes(trimmed) ? s.customCategories : [...s.customCategories, trimmed],
            categoryEmojiOverrides: emojiName
              ? { ...s.categoryEmojiOverrides, [trimmed]: emojiName }
              : s.categoryEmojiOverrides
          }
        }),
      removeCategory: (name) =>
        set((s) => {
          const emojiOverrides = { ...s.categoryEmojiOverrides }
          delete emojiOverrides[name]
          const colorOverrides = { ...s.categoryColorOverrides }
          delete colorOverrides[name]
          return {
            customCategories: s.customCategories.filter((n) => n !== name),
            removedDefaultCategories: (CATEGORIES as readonly string[]).includes(name)
              ? Array.from(new Set([...s.removedDefaultCategories, name]))
              : s.removedDefaultCategories,
            categoryEmojiOverrides: emojiOverrides,
            categoryColorOverrides: colorOverrides
          }
        }),
      renameCategory: (oldName, newName) =>
        set((s) => {
          const trimmed = newName.trim()
          if (!trimmed || trimmed === oldName) return s
          const isDefault = (CATEGORIES as readonly string[]).includes(oldName)
          const emojiOverrides = { ...s.categoryEmojiOverrides }
          if (emojiOverrides[oldName] != null) {
            emojiOverrides[trimmed] = emojiOverrides[oldName]
            delete emojiOverrides[oldName]
          }
          const colorOverrides = { ...s.categoryColorOverrides }
          if (colorOverrides[oldName] != null) {
            colorOverrides[trimmed] = colorOverrides[oldName]
            delete colorOverrides[oldName]
          }
          return {
            customCategories: isDefault
              ? s.customCategories.includes(trimmed)
                ? s.customCategories
                : [...s.customCategories, trimmed]
              : s.customCategories.map((n) => (n === oldName ? trimmed : n)),
            removedDefaultCategories: (isDefault
              ? Array.from(new Set([...s.removedDefaultCategories, oldName]))
              : s.removedDefaultCategories
            ).filter((n) => n !== trimmed),
            categoryEmojiOverrides: emojiOverrides,
            categoryColorOverrides: colorOverrides,
            items: s.items.map((it) => (it.category === oldName ? { ...it, category: trimmed, updatedAt: Date.now() } : it))
          }
        }),
      setCategoryEmoji: (name, emojiName) =>
        set((s) => ({ categoryEmojiOverrides: { ...s.categoryEmojiOverrides, [name]: emojiName } })),
      setCategoryColor: (name, colorKey) =>
        set((s) => ({ categoryColorOverrides: { ...s.categoryColorOverrides, [name]: colorKey } })),

      addTag: (name) =>
        set((s) => {
          const trimmed = name.trim()
          if (!trimmed) return s
          return {
            removedDefaultTags: s.removedDefaultTags.filter((n) => n !== trimmed),
            customTags: s.customTags.includes(trimmed) ? s.customTags : [...s.customTags, trimmed]
          }
        }),
      removeTag: (name) =>
        set((s) => ({
          customTags: s.customTags.filter((n) => n !== name),
          removedDefaultTags: (RECIPE_TAGS as readonly string[]).includes(name)
            ? Array.from(new Set([...s.removedDefaultTags, name]))
            : s.removedDefaultTags,
          recipes: s.recipes.map((r) => (r.tags.includes(name) ? { ...r, tags: r.tags.filter((t) => t !== name) } : r))
        })),
      renameTag: (oldName, newName) =>
        set((s) => {
          const trimmed = newName.trim()
          if (!trimmed || trimmed === oldName) return s
          const isDefault = (RECIPE_TAGS as readonly string[]).includes(oldName)
          return {
            customTags: isDefault
              ? s.customTags.includes(trimmed)
                ? s.customTags
                : [...s.customTags, trimmed]
              : s.customTags.map((n) => (n === oldName ? trimmed : n)),
            removedDefaultTags: (isDefault
              ? Array.from(new Set([...s.removedDefaultTags, oldName]))
              : s.removedDefaultTags
            ).filter((n) => n !== trimmed),
            recipes: s.recipes.map((r) =>
              r.tags.includes(oldName) ? { ...r, tags: r.tags.map((t) => (t === oldName ? trimmed : t)) } : r
            )
          }
        }),

      allCategories: () =>
        Array.from(new Set([...CATEGORIES, ...get().customCategories])).filter(
          (c) => !get().removedDefaultCategories.includes(c)
        ),
      allStores: () =>
        Array.from(new Set([...DEFAULT_STORES, ...get().customStores])).filter(
          (s) => !get().removedDefaultStores.includes(s)
        ),
      allBrands: () => Array.from(new Set(get().customBrands)),
      allTags: () =>
        Array.from(new Set([...RECIPE_TAGS, ...get().customTags])).filter((t) => !get().removedDefaultTags.includes(t))
    }),
    {
      name: 'listed-app-storage',
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as AppStore
        if (Array.isArray(state?.items)) {
          const fallbackStore = state.customStores?.[0] || DEFAULT_STORES[0]
          state.items = state.items.map((it) => (it.store ? it : { ...it, store: fallbackStore }))
        }
        const isLegacyKey = (key: string) => (DAYS_OF_WEEK as readonly string[]).includes(key.split('__')[0])
        if (state?.planningSlots) {
          state.planningSlots = Object.fromEntries(
            Object.entries(state.planningSlots).map(([key, list]) => [isLegacyKey(key) ? `w1__${key}` : key, list])
          )
        }
        if (state?.planningNotes) {
          state.planningNotes = Object.fromEntries(
            Object.entries(state.planningNotes).map(([key, note]) => [isLegacyKey(key) ? `w1__${key}` : key, note])
          )
        }
        return state
      }
    }
  )
)

export type { Unit }
