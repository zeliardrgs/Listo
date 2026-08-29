export interface CategoryColor {
  cardBg: string
  headerText: string
  iconBg: string
}

export interface ColorSwatch {
  key: string
  label: string
  swatch: string
  color: CategoryColor
}

export const COLOR_SWATCHES: ColorSwatch[] = [
  { key: 'red', label: 'Rouge', swatch: '#F5711F', color: { cardBg: 'bg-[#FFD0D5]', headerText: 'text-[#F5711F]', iconBg: 'bg-[#FFD0D5]' } },
  { key: 'orange', label: 'Orange', swatch: '#F56A1F', color: { cardBg: 'bg-[#FFE3D2]', headerText: 'text-[#F56A1F]', iconBg: 'bg-[#FFE3D2]' } },
  { key: 'cream', label: 'Crème', swatch: '#F5A31F', color: { cardBg: 'bg-[#FFF1DC]', headerText: 'text-[#F5A31F]', iconBg: 'bg-[#FFF1DC]' } },
  { key: 'lime', label: 'Citron vert', swatch: '#5DC426', color: { cardBg: 'bg-[#DEF4BA]', headerText: 'text-[#5DC426]', iconBg: 'bg-[#DEF4BA]' } },
  { key: 'green', label: 'Vert', swatch: '#23A104', color: { cardBg: 'bg-[#C4E8CC]', headerText: 'text-[#23A104]', iconBg: 'bg-[#C4E8CC]' } },
  { key: 'blue', label: 'Bleu', swatch: '#1F9CF5', color: { cardBg: 'bg-[#D0EDFF]', headerText: 'text-[#1F9CF5]', iconBg: 'bg-[#D0EDFF]' } },
  { key: 'indigo', label: 'Indigo', swatch: '#565DE5', color: { cardBg: 'bg-[#C3CCF6]', headerText: 'text-[#565DE5]', iconBg: 'bg-[#C3CCF6]' } },
  { key: 'purple', label: 'Violet', swatch: '#B267DE', color: { cardBg: 'bg-[#DED5F0]', headerText: 'text-[#B267DE]', iconBg: 'bg-[#DED5F0]' } },
  { key: 'pink', label: 'Rose', swatch: '#E45EE2', color: { cardBg: 'bg-[#FFE2FF]', headerText: 'text-[#E45EE2]', iconBg: 'bg-[#FFE2FF]' } },
  { key: 'gray', label: 'Gris', swatch: '#829BAD', color: { cardBg: 'bg-[#DBE2E6]', headerText: 'text-[#829BAD]', iconBg: 'bg-[#DBE2E6]' } }
]

const CATEGORY_DEFAULT_COLOR_KEY: Record<string, string> = {
  Fruits: 'pink',
  Légumes: 'green',
  Viande: 'red',
  Poisson: 'blue',
  Crémerie: 'indigo',
  Fromage: 'cream',
  Boulangerie: 'orange',
  Conserves: 'gray',
  'Épicerie salée': 'purple',
  'Épicerie sucrée': 'pink',
  'Pâtes & Riz': 'lime',
  Surgelés: 'blue',
  Boissons: 'indigo',
  Hygiène: 'purple',
  Entretien: 'gray',
  Bébé: 'pink',
  Animaux: 'orange',
  Autre: 'gray'
}

const FALLBACK_COLOR_KEYS = ['lime', 'indigo', 'pink', 'green']

export function colorByKey(key: string): CategoryColor | undefined {
  return COLOR_SWATCHES.find((c) => c.key === key)?.color
}

export function categoryColorKey(category: string, overrides?: Record<string, string>): string {
  const override = overrides?.[category]
  if (override && colorByKey(override)) return override
  if (CATEGORY_DEFAULT_COLOR_KEY[category]) return CATEGORY_DEFAULT_COLOR_KEY[category]
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  return FALLBACK_COLOR_KEYS[hash % FALLBACK_COLOR_KEYS.length]
}

export function categoryColor(category: string, overrides?: Record<string, string>): CategoryColor {
  return colorByKey(categoryColorKey(category, overrides))!
}

export const NEUTRAL_GROUP_COLOR: CategoryColor = {
  cardBg: 'bg-[#fff1dc]',
  headerText: 'text-brand-700',
  iconBg: 'bg-brand-50'
}
