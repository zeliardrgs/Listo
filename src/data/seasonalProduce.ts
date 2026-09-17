// French seasonality (peak months, 1 = janvier … 12 = décembre) for the
// fruits & légumes in PRODUCT_SUGGESTIONS, sourced from Greenpeace France's
// seasonal calendar (France métropolitaine): https://www.greenpeace.fr/guetteur/calendrier/
// Two names don't exist as-is on that calendar and are mapped to their
// closest equivalent there:
//  - "Salade" -> "Laitue" (Greenpeace lists specific salad greens, no generic "salade")
//  - "Pomme de terre" -> union of "Pomme de terre primeur" (new potatoes) and
//    "Pomme de terre de conservation" (storage potatoes), which together
//    cover the full year
// Tropical/always-imported fruit (banane, avocat) aren't on Greenpeace's
// calendar at all (explicitly excluded by them — grown too far from mainland
// France) and champignon de Paris is cultivated indoors year-round, so none
// of these three get a season here.
export const SEASONAL_MONTHS: Record<string, number[]> = {
  Pomme: [1, 2, 3, 4, 6, 8, 9, 10, 11, 12],
  Poire: [1, 2, 3, 4, 7, 8, 9, 10, 11, 12],
  Orange: [1, 2, 3, 11, 12],
  Citron: [1, 2, 3, 4, 6, 10, 11, 12],
  Fraise: [5, 6, 7, 8],
  Tomate: [5, 6, 7, 8, 9, 10],
  Carotte: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Courgette: [5, 6, 7, 8, 9, 10],
  Oignon: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Ail: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'Pomme de terre': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Salade: [4, 5, 6, 7, 8, 9, 10],
  Poivron: [6, 7, 8, 9],
  Brocoli: [6, 7, 8, 9, 10, 11],
  Concombre: [4, 5, 6, 7, 8, 9, 10],
  Poireau: [1, 2, 3, 4, 9, 10, 11, 12],
  Aubergine: [5, 6, 7, 8, 9, 10],
  'Chou-fleur': [3, 4, 5, 9, 10, 11],
  Épinard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Radis: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Navet: [1, 2, 3, 4, 5, 6, 10, 11, 12],
  Betterave: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  Échalote: [10, 11, 12],
  Céleri: [1, 2, 3, 7, 8, 9, 10, 11, 12],
  Artichaut: [4, 5, 6, 7, 8, 9],
  Asperge: [3, 4, 5, 6, 7],
  'Petit pois': [4, 5, 6, 7],
  'Haricot vert': [6, 7, 8, 9, 10],
  Endive: [1, 2, 3, 4, 10, 11, 12],
  Panais: [1, 2, 3, 9, 10, 11, 12],
  Potiron: [9, 10, 11, 12],
  Chou: [1, 2, 3, 6, 7, 8, 9, 10, 11, 12],
  'Chou de Bruxelles': [1, 2, 3, 9, 10, 11, 12],
  'Patate douce': [9, 10],
  Kiwi: [1, 2, 3, 11, 12],
  Pamplemousse: [1, 2, 3, 4, 5, 6],
  Raisin: [8, 9, 10],
  Melon: [6, 7, 8, 9],
  Pastèque: [6, 7, 8, 9],
  Pêche: [6, 7, 8, 9],
  Abricot: [6, 7, 8],
  Prune: [6, 7, 8, 9],
  Cerise: [5, 6, 7],
  Mandarine: [1, 2, 11, 12],
  Clémentine: [1, 2, 11, 12],
  Framboise: [6, 7, 8, 10],
  Myrtille: [7, 8, 9, 10],
  Figue: [7, 8, 9, 10]
}

export function isInSeason(name: string, month: number = new Date().getMonth() + 1): boolean {
  return SEASONAL_MONTHS[name]?.includes(month) ?? false
}
