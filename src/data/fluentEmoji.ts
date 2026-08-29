// Maps our internal category/product names to the Microsoft Fluent Emoji
// asset name (the exact folder name in microsoft/fluentui-emoji), served via
// the jsDelivr GitHub CDN which sends permissive CORS headers.
const CATEGORY_EMOJI_NAME: Record<string, string> = {
  Fruits: 'Red apple',
  Légumes: 'Carrot',
  Viande: 'Cut of meat',
  Poisson: 'Fish',
  Crémerie: 'Glass of milk',
  Fromage: 'Cheese wedge',
  Boulangerie: 'Bread',
  Conserves: 'Canned food',
  'Épicerie salée': 'Salt',
  'Épicerie sucrée': 'Chocolate bar',
  'Pâtes & Riz': 'Spaghetti',
  Surgelés: 'Ice',
  Boissons: 'Cup with straw',
  Hygiène: 'Soap',
  Entretien: 'Sponge',
  Bébé: 'Baby bottle',
  Animaux: 'Paw prints',
  Autre: 'Shopping cart',
  // recipe categories
  Entrée: 'Green salad',
  Plat: 'Pot of food',
  Dessert: 'Shortcake',
  Apéritif: 'Cocktail glass',
  'Petit-déjeuner': 'Croissant',
  'Sauce/Base': 'Honey pot'
}

export const DEFAULT_CATEGORY_EMOJI = 'Shopping cart'
export const DEFAULT_STORE_EMOJI = 'Shopping bags'

// Default (non-personalized) emoji for a category. Prefer the
// `useCategoryEmojiName` hook when rendering inside a component, so a
// user's custom emoji (set from Settings) is taken into account.
export function categoryEmojiName(category: string): string {
  return CATEGORY_EMOJI_NAME[category] || DEFAULT_CATEGORY_EMOJI
}

export function fluentEmojiUrl(emojiName: string): string {
  const slug = emojiName.toLowerCase().replace(/\s+/g, '_')
  return `https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/${encodeURIComponent(emojiName)}/3D/${slug}_3d.png`
}
