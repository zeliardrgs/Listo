import type { ProductSuggestion, Unit } from '../types'

export const CATEGORIES = [
  'Fruits',
  'Légumes',
  'Viande',
  'Poisson',
  'Crémerie',
  'Fromage',
  'Boulangerie',
  'Conserves',
  'Épicerie salée',
  'Épicerie sucrée',
  'Pâtes & Riz',
  'Surgelés',
  'Boissons',
  'Hygiène',
  'Entretien',
  'Bébé',
  'Animaux',
  'Autre'
] as const

export const CATEGORY_EMOJIS: Record<string, string> = {
  Fruits: '🍎',
  Légumes: '🥕',
  Viande: '🥩',
  Poisson: '🐟',
  Crémerie: '🥛',
  Fromage: '🧀',
  Boulangerie: '🥖',
  Conserves: '🥫',
  'Épicerie salée': '🧂',
  'Épicerie sucrée': '🍫',
  'Pâtes & Riz': '🍝',
  Surgelés: '🧊',
  Boissons: '🥤',
  Hygiène: '🧴',
  Entretien: '🧽',
  Bébé: '🍼',
  Animaux: '🐾',
  Autre: '🛒'
}

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] || '🛒'
}

export const RECIPE_CATEGORIES = ['Entrée', 'Plat', 'Dessert', 'Apéritif', 'Petit-déjeuner', 'Sauce/Base'] as const

export const RECIPE_TAGS = [
  'Rapide',
  'Léger',
  'Healthy',
  'Froid',
  'Été',
  'Hiver',
  'Pâtes',
  'Végétarien',
  'Vegan',
  'Sans gluten',
  'Confort',
  'Économique',
  'Fait maison',
  'Enfants'
] as const

export const SOLID_UNITS: Unit[] = ['pièce', 'g', 'kg', 'paquet', 'boîte', 'botte', 'tranche', 'barquette', 'pincée']
export const LIQUID_UNITS: Unit[] = ['ml', 'cl', 'l']

export const DEFAULT_STORES = ['Supermarché', 'Marché', 'Boulangerie', 'Boucherie', 'Pharmacie'] as const

export const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

export const MEAL_SLOTS = ['Matin', 'Midi', 'Goûter', 'Soir'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]

export const PLANNING_WEEKS = ['w1', 'w2'] as const
export type PlanningWeek = (typeof PLANNING_WEEKS)[number]

export const MAX_PER_PLANNING_SLOT = 3

export const PRODUCT_SUGGESTIONS: ProductSuggestion[] = [
  { name: 'Pomme', category: 'Fruits', unit: 'kg' },
  { name: 'Banane', category: 'Fruits', unit: 'kg' },
  { name: 'Poire', category: 'Fruits', unit: 'kg' },
  { name: 'Orange', category: 'Fruits', unit: 'kg' },
  { name: 'Citron', category: 'Fruits', unit: 'pièce' },
  { name: 'Fraise', category: 'Fruits', unit: 'barquette' as Unit },
  { name: 'Avocat', category: 'Fruits', unit: 'pièce' },
  { name: 'Tomate', category: 'Légumes', unit: 'kg' },
  { name: 'Carotte', category: 'Légumes', unit: 'kg' },
  { name: 'Courgette', category: 'Légumes', unit: 'kg' },
  { name: 'Oignon', category: 'Légumes', unit: 'kg' },
  { name: 'Ail', category: 'Légumes', unit: 'pièce' },
  { name: 'Pomme de terre', category: 'Légumes', unit: 'kg' },
  { name: 'Salade', category: 'Légumes', unit: 'pièce' },
  { name: 'Poivron', category: 'Légumes', unit: 'pièce' },
  { name: 'Champignon', category: 'Légumes', unit: 'g' },
  { name: 'Brocoli', category: 'Légumes', unit: 'pièce' },
  { name: 'Concombre', category: 'Légumes', unit: 'pièce' },
  { name: 'Poulet', category: 'Viande', unit: 'kg' },
  { name: 'Bœuf haché', category: 'Viande', unit: 'kg' },
  { name: 'Steak', category: 'Viande', unit: 'pièce' },
  { name: 'Saucisse', category: 'Viande', unit: 'paquet' },
  { name: 'Lardons', category: 'Viande', unit: 'paquet' },
  { name: 'Jambon', category: 'Viande', unit: 'tranche' },
  { name: 'Saumon', category: 'Poisson', unit: 'pièce' },
  { name: 'Cabillaud', category: 'Poisson', unit: 'pièce' },
  { name: 'Thon en boîte', category: 'Conserves', unit: 'boîte' },
  { name: 'Lait', category: 'Crémerie', unit: 'l' },
  { name: 'Œufs', category: 'Crémerie', unit: 'pièce' },
  { name: 'Beurre', category: 'Crémerie', unit: 'pièce' },
  { name: 'Yaourt', category: 'Crémerie', unit: 'pièce' },
  { name: 'Crème fraîche', category: 'Crémerie', unit: 'pièce' },
  { name: 'Emmental', category: 'Fromage', unit: 'g' },
  { name: 'Chèvre', category: 'Fromage', unit: 'pièce' },
  { name: 'Camembert', category: 'Fromage', unit: 'pièce' },
  { name: 'Mozzarella', category: 'Fromage', unit: 'pièce' },
  { name: 'Pain', category: 'Boulangerie', unit: 'pièce' },
  { name: 'Baguette', category: 'Boulangerie', unit: 'pièce' },
  { name: 'Croissant', category: 'Boulangerie', unit: 'pièce' },
  { name: 'Tomates pelées', category: 'Conserves', unit: 'boîte' },
  { name: 'Maïs', category: 'Conserves', unit: 'boîte' },
  { name: 'Haricots rouges', category: 'Conserves', unit: 'boîte' },
  { name: 'Lentilles', category: 'Épicerie salée', unit: 'paquet' },
  { name: 'Farine', category: 'Épicerie sucrée', unit: 'kg' },
  { name: 'Sucre', category: 'Épicerie sucrée', unit: 'kg' },
  { name: 'Chocolat', category: 'Épicerie sucrée', unit: 'pièce' },
  { name: 'Huile d\'olive', category: 'Épicerie salée', unit: 'pièce' },
  { name: 'Sel', category: 'Épicerie salée', unit: 'pièce' },
  { name: 'Poivre', category: 'Épicerie salée', unit: 'pièce' },
  { name: 'Pâtes', category: 'Pâtes & Riz', unit: 'paquet' },
  { name: 'Riz', category: 'Pâtes & Riz', unit: 'paquet' },
  { name: 'Semoule', category: 'Pâtes & Riz', unit: 'paquet' },
  { name: 'Pizza surgelée', category: 'Surgelés', unit: 'pièce' },
  { name: 'Légumes surgelés', category: 'Surgelés', unit: 'paquet' },
  { name: 'Glace', category: 'Surgelés', unit: 'pièce' },
  { name: 'Eau', category: 'Boissons', unit: 'l' },
  { name: 'Jus de fruit', category: 'Boissons', unit: 'l' },
  { name: 'Café', category: 'Boissons', unit: 'paquet' },
  { name: 'Thé', category: 'Boissons', unit: 'paquet' },
  { name: 'Vin', category: 'Boissons', unit: 'pièce' },
  { name: 'Dentifrice', category: 'Hygiène', unit: 'pièce' },
  { name: 'Shampoing', category: 'Hygiène', unit: 'pièce' },
  { name: 'Savon', category: 'Hygiène', unit: 'pièce' },
  { name: 'Papier toilette', category: 'Hygiène', unit: 'paquet' },
  { name: 'Déodorant', category: 'Hygiène', unit: 'pièce' },
  { name: 'Liquide vaisselle', category: 'Entretien', unit: 'pièce' },
  { name: 'Lessive', category: 'Entretien', unit: 'pièce' },
  { name: 'Éponge', category: 'Entretien', unit: 'paquet' },
  { name: 'Sac poubelle', category: 'Entretien', unit: 'paquet' }
]
