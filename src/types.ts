export type Unit = 'pièce' | 'g' | 'kg' | 'ml' | 'l' | 'paquet' | 'boîte' | 'botte' | 'tranche' | 'barquette'

export interface StoreIconValue {
  type: 'emoji' | 'image'
  value: string
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

export interface AppState {
  items: ShoppingItem[]
  recipes: Recipe[]
  customCategories: string[]
  customStores: string[]
  customBrands: string[]
}
