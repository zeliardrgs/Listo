import { forwardRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { groupByCategory } from '../utils/exportList'
import { fluentEmojiUrl } from '../data/fluentEmoji'
import { useCategoryEmojiName } from '../hooks/useCategoryEmojiName'
import { useCategoryColor } from '../hooks/useCategoryColor'
import { useStoreIcon } from '../hooks/useStoreIcon'
import ListoLogo from './ListoLogo'
import { formatRecipeQuantity } from '../utils/formatRecipeQuantity'
import type { ShoppingItem } from '../types'

function hexFrom(cls: string): string {
  const m = cls.match(/#([0-9a-fA-F]{3,8})/)
  return m ? `#${m[1]}` : '#f3f3f3'
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const today = () =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const ShoppingListPrintable = forwardRef<HTMLDivElement, { store: string; items: ShoppingItem[] }>(
  ({ store, items }, ref) => {
    const groups = groupByCategory(items)
    const recipes = useAppStore((s) => s.recipes)
    const emojiFor = useCategoryEmojiName()
    const colorFor = useCategoryColor()
    const storeIconFor = useStoreIcon()
    const storeIcon = storeIconFor(store)

    function recipesUsing(item: ShoppingItem): string[] {
      if (!item.fromRecipes || item.fromRecipes.length === 0) return []
      return item.fromRecipes.map((id) => recipes.find((r) => r.id === id)?.name).filter(Boolean) as string[]
    }

    return (
      <div
        ref={ref}
        style={{
          width: 420,
          padding: 28,
          background: '#ffffff',
          fontFamily: "'Nunito', system-ui, sans-serif",
          color: '#334155'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <ListoLogo color="#f5841f" style={{ height: 26, width: 'auto' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{today()}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {storeIcon.type === 'image' ? (
              <img
                src={storeIcon.value}
                alt=""
                crossOrigin="anonymous"
                width={28}
                height={28}
                style={{ borderRadius: 9999, objectFit: 'cover' }}
              />
            ) : (
              <img
                src={fluentEmojiUrl(storeIcon.value)}
                alt=""
                crossOrigin="anonymous"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
              />
            )}
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#475569', margin: 0 }}>{store}</h1>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#c9650f',
              background: '#ffedd5',
              borderRadius: 9999,
              padding: '5px 14px'
            }}
          >
            {items.length} Article{items.length > 1 ? 's' : ''}
          </span>
        </div>

        {groups.map(([cat, list]) => {
          const color = colorFor(cat)
          const bg = hexFrom(color.cardBg)
          const text = hexFrom(color.headerText)
          return (
            <div
              key={cat}
              style={{
                marginBottom: 20,
                borderRadius: 18,
                overflow: 'hidden',
                background: bg,
                border: `2px solid ${hexToRgba(text, 0.45)}`
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  fontSize: 16,
                  fontWeight: 800,
                  color: text
                }}
              >
                <img src={fluentEmojiUrl(emojiFor(cat))} alt="" crossOrigin="anonymous" width={20} height={20} style={{ objectFit: 'contain' }} />
                {cat}
              </div>
              <div style={{ background: '#ffffff' }}>
                {list.map((it, idx) => {
                  const usedIn = recipesUsing(it)
                  return (
                    <div
                      key={it.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9'
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 7,
                          border: '2px solid #ffd9a8',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{it.name}</span>
                          {formatRecipeQuantity(it.recipeQuantities) && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                              • {formatRecipeQuantity(it.recipeQuantities)}
                            </span>
                          )}
                        </div>
                        {(it.brand || usedIn.length > 0) && (
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                            {[it.brand, ...usedIn].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)

ShoppingListPrintable.displayName = 'ShoppingListPrintable'
export default ShoppingListPrintable
