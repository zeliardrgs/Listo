import { forwardRef, Fragment } from 'react'
import { MEAL_SLOTS } from '../data/constants'
import { planningKey, type PlanningWeekBlock } from '../utils/exportPlanning'
import type { PlanningItem, Recipe } from '../types'

const PlanningPrintable = forwardRef<
  HTMLDivElement,
  {
    weekBlocks: PlanningWeekBlock[]
    slots: Record<string, PlanningItem[]>
    notes: Record<string, string>
    recipesById: Map<string, Recipe>
  }
>(({ weekBlocks, slots, notes, recipesById }, ref) => {
  const blocks = weekBlocks
    .map((block) => ({
      block,
      rows: MEAL_SLOTS.filter((slot) =>
        block.days.some((day) => {
          const key = planningKey(block.week, day, slot)
          const hasRecipe = (slots[key] || []).some((i) => recipesById.has(i.recipeId))
          return hasRecipe || notes[key]
        })
      )
    }))
    .filter((b) => b.rows.length > 0)

  return (
    <div
      ref={ref}
      style={{
        display: 'inline-block',
        padding: 24,
        background: '#ffffff',
        fontFamily: "'Nunito', system-ui, sans-serif"
      }}
    >
      {blocks.length === 0 && (
        <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', padding: 12 }}>Aucune recette planifiée.</div>
      )}
      {blocks.map(({ block, rows }, bi) => (
        <div key={block.week} style={{ marginBottom: bi < blocks.length - 1 ? 28 : 0 }}>
          {weekBlocks.length > 1 && (
            <div style={{ fontSize: 16, fontWeight: 800, color: '#c9650f', marginBottom: 10 }}>{block.label}</div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `76px repeat(${block.days.length}, 156px)`,
              border: '1px solid #ffe9cc',
              borderRadius: 14,
              overflow: 'hidden'
            }}
          >
            <div style={{ background: '#fff1dc' }} />
            {block.days.map((day) => (
              <div
                key={day}
                style={{
                  background: '#fff1dc',
                  padding: '10px 6px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#c9650f',
                  borderLeft: '1px solid #ffe9cc'
                }}
              >
                {day}
              </div>
            ))}

            {rows.map((slot) => (
              <Fragment key={slot}>
                <div
                  style={{
                    padding: '8px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#94a3b8',
                    borderTop: '1px solid #ffe9cc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                  }}
                >
                  {slot}
                </div>
                {block.days.map((day) => {
                  const key = planningKey(block.week, day, slot)
                  const items = slots[key] || []
                  const note = notes[key]
                  return (
                    <div
                      key={key}
                      style={{
                        padding: 6,
                        borderTop: '1px solid #ffe9cc',
                        borderLeft: '1px solid #ffe9cc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                    >
                      {items.map((item) => {
                        const recipe = recipesById.get(item.recipeId)
                        if (!recipe) return null
                        return (
                          <div
                            key={item.id}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#1e293b',
                              background: '#fff7ec',
                              borderRadius: 6,
                              padding: '4px 6px',
                              wordBreak: 'break-word'
                            }}
                          >
                            {recipe.name}
                          </div>
                        )
                      })}
                      {note && (
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#94a3b8',
                            background: '#f8fafc',
                            borderRadius: 6,
                            padding: '4px 6px',
                            wordBreak: 'break-word'
                          }}
                        >
                          {note}
                        </div>
                      )}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
})

PlanningPrintable.displayName = 'PlanningPrintable'
export default PlanningPrintable
