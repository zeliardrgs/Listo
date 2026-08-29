import { create } from 'zustand'

// Tracks whether each household subcollection/doc has received its first
// Firestore snapshot yet, so the UI can show a loading state instead of a
// misleading "empty" one while the initial fetch is still in flight.
interface SyncStatusState {
  loaded: Record<string, boolean>
  markLoaded: (key: string) => void
  reset: () => void
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  loaded: {},
  markLoaded: (key) => set((s) => ({ loaded: { ...s.loaded, [key]: true } })),
  reset: () => set({ loaded: {} })
}))
