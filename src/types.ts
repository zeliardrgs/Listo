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
  toBuy: boolean
  quantity?: number
  unit?: Unit
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
