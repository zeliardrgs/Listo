// Approximate French seasonality (peak months, 1 = janvier … 12 = décembre)
// for produce actually grown/harvested in France. Tropical or always-imported
// items (banane, avocat) and long-storage staples (ail, oignon, pomme de
// terre, champignon de Paris) are intentionally left out — they're sold
// year-round, so an "in season" badge wouldn't mean much for them.
export const SEASONAL_MONTHS: Record<string, number[]> = {
  Pomme: [1, 2, 9, 10, 11, 12],
  Poire: [1, 8, 9, 10, 11, 12],
  Orange: [1, 2, 3, 4, 12],
  Citron: [1, 2, 3, 11, 12],
  Fraise: [5, 6, 7, 8, 9],
  Tomate: [6, 7, 8, 9, 10],
  Courgette: [5, 6, 7, 8, 9, 10],
  Carotte: [6, 7, 8, 9, 10],
  Salade: [4, 5, 6, 7, 8, 9, 10],
  Poivron: [6, 7, 8, 9, 10],
  Brocoli: [1, 2, 3, 4, 10, 11, 12],
  Concombre: [5, 6, 7, 8, 9]
}

export function isInSeason(name: string, month: number = new Date().getMonth() + 1): boolean {
  return SEASONAL_MONTHS[name]?.includes(month) ?? false
}
