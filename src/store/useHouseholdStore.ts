import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HouseholdState {
  activeCode: string | null
  activeName: string | null
  setActiveCode: (code: string | null, name?: string | null) => void
  setActiveName: (name: string | null) => void
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeCode: null,
      activeName: null,
      setActiveCode: (code, name = null) => set({ activeCode: code, activeName: code ? name ?? null : null }),
      setActiveName: (name) => set({ activeName: name })
    }),
    { name: 'listo-household' }
  )
)
