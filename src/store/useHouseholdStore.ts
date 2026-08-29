import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HouseholdState {
  activeCode: string | null
  setActiveCode: (code: string | null) => void
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeCode: null,
      setActiveCode: (code) => set({ activeCode: code })
    }),
    { name: 'listo-household' }
  )
)
