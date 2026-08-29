import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAppStore } from '../store/useAppStore'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { useSyncStatusStore } from '../store/useSyncStatusStore'
import { emptySyncedAppData, pickConfig, type SharedConfig } from '../lib/sync'
import { syncKeyedCollection } from '../lib/collectionSync'
import type { PlanningItem, Recipe, ShoppingItem } from '../types'

const PUSH_DEBOUNCE_MS = 400

function arrayToRecord<T extends { id: string }>(arr: T[]): Record<string, T> {
  const out: Record<string, T> = {}
  arr.forEach((item) => {
    out[item.id] = item
  })
  return out
}

interface SlotValue {
  items: PlanningItem[]
  note: string
}

function getSlotsLocal(): Record<string, SlotValue> {
  const { planningSlots, planningNotes } = useAppStore.getState()
  const keys = new Set([...Object.keys(planningSlots), ...Object.keys(planningNotes)])
  const out: Record<string, SlotValue> = {}
  keys.forEach((key) => {
    const items = planningSlots[key] || []
    const note = planningNotes[key] || ''
    if (items.length > 0 || note) out[key] = { items, note }
  })
  return out
}

function applySlotsLocal(next: Record<string, SlotValue>) {
  const planningSlots: Record<string, PlanningItem[]> = {}
  const planningNotes: Record<string, string> = {}
  Object.entries(next).forEach(([key, v]) => {
    if (v.items?.length) planningSlots[key] = v.items
    if (v.note) planningNotes[key] = v.note
  })
  useAppStore.setState({ planningSlots, planningNotes })
}

// Keeps the app store in sync with the active household: the small,
// rarely-changed settings (stores/categories/tags/overrides) sync as one
// document, while items/recipes/planning queue/planning slots each sync as
// their own Firestore subcollection (one doc per entity) via
// syncKeyedCollection — so two devices editing different things offline
// never clobber each other's changes when they reconnect.
export function useHouseholdSync() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  // Persists across re-renders (unlike a variable inside the effect) so we
  // can tell "switched away from a household" apart from "resumed the same
  // household after a reload" — only the former should wipe local data.
  const previousCode = useRef<string | null>(null)

  useEffect(() => {
    if (previousCode.current !== null && previousCode.current !== activeCode) {
      useAppStore.setState(emptySyncedAppData())
    }
    previousCode.current = activeCode
    useSyncStatusStore.getState().reset()

    if (!activeCode) return

    const stopFns: Array<() => void> = []

    stopFns.push(
      syncKeyedCollection<ShoppingItem>(
        activeCode,
        'items',
        () => arrayToRecord(useAppStore.getState().items),
        (rec) => useAppStore.setState({ items: Object.values(rec) }),
        () => useSyncStatusStore.getState().markLoaded('items')
      )
    )
    stopFns.push(
      syncKeyedCollection<Recipe>(
        activeCode,
        'recipes',
        () => arrayToRecord(useAppStore.getState().recipes),
        (rec) => useAppStore.setState({ recipes: Object.values(rec) }),
        () => useSyncStatusStore.getState().markLoaded('recipes')
      )
    )
    stopFns.push(
      syncKeyedCollection<PlanningItem>(
        activeCode,
        'planningQueue',
        () => arrayToRecord(useAppStore.getState().planningQueue),
        (rec) => useAppStore.setState({ planningQueue: Object.values(rec) }),
        () => useSyncStatusStore.getState().markLoaded('planningQueue')
      )
    )
    stopFns.push(
      syncKeyedCollection<SlotValue>(activeCode, 'planningSlots', getSlotsLocal, applySlotsLocal, () =>
        useSyncStatusStore.getState().markLoaded('planningSlots')
      )
    )

    // Shared settings (stores/categories/tags/overrides): one small document,
    // rarely edited concurrently, so a plain whole-object sync is enough.
    const configRef = doc(db, 'households', activeCode)
    let lastConfigRemoteJSON: string | null = null
    let lastConfigPushedJSON: string | null = null
    let receivedFirstConfig = false
    let configPushTimer: ReturnType<typeof setTimeout> | undefined

    const unsubscribeConfigSnapshot = onSnapshot(configRef, (snap) => {
      const remote = snap.data()?.config as SharedConfig | undefined
      const remoteJSON = remote ? JSON.stringify(remote) : null

      if (!receivedFirstConfig) {
        receivedFirstConfig = true
        if (remote) {
          lastConfigRemoteJSON = remoteJSON
          useAppStore.setState(remote)
        } else {
          const initial = pickConfig(useAppStore.getState())
          lastConfigPushedJSON = JSON.stringify(initial)
          setDoc(configRef, { config: initial }, { merge: true })
        }
        useSyncStatusStore.getState().markLoaded('config')
        return
      }

      if (remoteJSON === lastConfigPushedJSON) return
      lastConfigRemoteJSON = remoteJSON
      if (remote) useAppStore.setState(remote)
    })

    const unsubscribeConfigStore = useAppStore.subscribe((state) => {
      const config = pickConfig(state)
      const json = JSON.stringify(config)
      if (json === lastConfigRemoteJSON) return
      clearTimeout(configPushTimer)
      configPushTimer = setTimeout(() => {
        lastConfigPushedJSON = json
        setDoc(configRef, { config }, { merge: true })
      }, PUSH_DEBOUNCE_MS)
    })

    stopFns.push(() => {
      unsubscribeConfigSnapshot()
      unsubscribeConfigStore()
      clearTimeout(configPushTimer)
    })

    return () => stopFns.forEach((stop) => stop())
  }, [activeCode])
}
