const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatPrice(price: number): string {
  return formatter.format(price)
}
