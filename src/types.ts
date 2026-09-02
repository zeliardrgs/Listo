export type Unit = 'pièce' | 'g' | 'kg' | 'ml' | 'cl' | 'l' | 'paquet' | 'boîte' | 'botte' | 'tranche' | 'barquette' | 'pincée'

export interface StoreIconValue {
  type: 'emoji' | 'image'
  value: string
}

// Quantity a single recipe contributes to a shopping item, keyed by recipe so
// it can be replaced (recipe edited) or dropped (recipe un-added) without
// disturbing what other recipes contributed to the same item.
export interface RecipeQuantityContribution {
  recipeId: string
  quantity?: number
  unit?: Unit
}

export interface ShoppingItem {
  id: string
  name: string
  category: string
  brand: string
  store: string
  recurring: boolean
  // Removed from the list entirely once the shopping trip that bought it is
  // finished, instead of just being marked "not to buy" again.
  onceOnly?: boolean
  toBuy: boolean
  checked: boolean
  updatedAt: number
  fromRecipes?: string[]
  // Only ever set for recipe-linked items — a manually added article has no
  // quantity, matching one recipe's contribution per entry.
  recipeQuantities?: RecipeQuantityContribution[]
}

export interface ProductSuggestion {
  name: string
  category: string
  brand?: string
  store?: string
  unit?: Unit
}

export interface RecipeIngredient {
  id: string
  name: string
  quantity?: number
  unit?: Unit
  category?: string
  // Pantry staples the user already has on hand (oil, salt...): shown apart
  // from the rest of the ingredients, and skipped when bulk-adding a
  // recipe's ingredients to the shopping list (still addable one by one).
  inStock?: boolean
}

export interface Recipe {
  id: string
  name: string
  category: string
  servings: number
  ingredients: RecipeIngredient[]
  instructions: string
  tags: string[]
  imageUrl?: string
  sourceUrl?: string
  createdAt: number
}

export interface PlanningItem {
  id: string
  recipeId: string
}

// Outcome of matching one recipe ingredient against the shopping list when
// bulk-adding a recipe's ingredients — either it merged into an existing
// item, or a brand new one was created (shown to the user for review, with
// a chance to re-point it at an existing item after the fact).
export interface IngredientMatchResult {
  ingredientName: string
  matchedItemId: string | null
  matchedItemName: string | null
  createdItemId: string | null
}

export interface AppState {
  items: ShoppingItem[]
  recipes: Recipe[]
  customCategories: string[]
  customStores: string[]
  customBrands: string[]
}
