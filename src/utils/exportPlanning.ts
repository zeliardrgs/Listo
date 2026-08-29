import { MEAL_SLOTS } from '../data/constants'
import { fallbackCopy } from './exportList'
import type { DayOfWeek, MealSlot, PlanningWeek } from '../data/constants'
import type { PlanningItem, Recipe } from '../types'

export interface PlanningWeekBlock {
  week: PlanningWeek
  label: string
  days: DayOfWeek[]
}

export function planningKey(week: PlanningWeek, day: DayOfWeek, slot: MealSlot) {
  return `${week}__${day}__${slot}`
}

export function buildPlanningText(
  weekBlocks: PlanningWeekBlock[],
  slots: Record<string, PlanningItem[]>,
  notes: Record<string, string>,
  recipesById: Map<string, Recipe>
): string {
  const lines: string[] = ['Planning', '']
  weekBlocks.forEach((block) => {
    const dayLines: string[] = []
    block.days.forEach((day) => {
      const rows: string[] = []
      MEAL_SLOTS.forEach((slot) => {
        const key = planningKey(block.week, day, slot)
        const items = slots[key] || []
        const note = notes[key]
        const names = items.map((i) => recipesById.get(i.recipeId)?.name).filter(Boolean) as string[]
        if (names.length === 0 && !note) return
        const parts = [...names]
        if (note) parts.push(`(${note})`)
        rows.push(`  ${slot} : ${parts.join(', ')}`)
      })
      if (rows.length > 0) {
        dayLines.push(day)
        dayLines.push(...rows)
      }
    })
    if (dayLines.length > 0) {
      if (weekBlocks.length > 1) lines.push(block.label)
      lines.push(...dayLines, '')
    }
  })
  return lines.join('\n').trim()
}

export async function copyPlanningToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    fallbackCopy(text)
  }
}
