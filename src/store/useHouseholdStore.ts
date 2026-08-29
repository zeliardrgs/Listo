import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HouseholdEntry {
  code: string
  name: string
}

interface HouseholdState {
  households: HouseholdEntry[]
  activeCode: string | null
  // Adds a household (create/join) if not already known, and activates it.
  addHousehold: (entry: HouseholdEntry) => void
  // Switches to an already-joined household.
  switchTo: (code: string) => void
  // Removes a household from this device's joined list.
  leave: (code: string) => void
  // Updates the locally-known name for a household (optimistic rename, or a
  // remote rename picked up by the sync listener).
  updateName: (code: string, name: string) => void
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      households: [],
      activeCode: null,

      addHousehold: (entry) =>
        set((s) => {
          const exists = s.households.some((h) => h.code === entry.code)
          const households = exists
            ? s.households.map((h) => (h.code === entry.code ? entry : h))
            : [...s.households, entry]
          return { households, activeCode: entry.code }
        }),

      switchTo: (code) => {
        const s = get()
        if (s.activeCode === code || !s.households.some((h) => h.code === code)) return
        set({ activeCode: code })
      },

      leave: (code) =>
        set((s) => {
          const households = s.households.filter((h) => h.code !== code)
          return {
            households,
            activeCode: s.activeCode === code ? households[0]?.code ?? null : s.activeCode
          }
        }),

      updateName: (code, name) =>
        set((s) => ({ households: s.households.map((h) => (h.code === code ? { ...h, name } : h)) }))
    }),
    {
      name: 'listo-household',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as { activeCode?: string; activeName?: string; households?: HouseholdEntry[] }
        if (!state?.households && state?.activeCode) {
          state.households = [{ code: state.activeCode, name: state.activeName || state.activeCode }]
        }
        return state
      }
    }
  )
)
