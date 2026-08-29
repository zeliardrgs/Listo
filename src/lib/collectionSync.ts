import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAppStore } from '../store/useAppStore'

const PUSH_DEBOUNCE_MS = 400

// Syncs a household subcollection against a `Record<key, value>` slice of
// local state, one Firestore document per key. Unlike syncing one big blob,
// two devices editing DIFFERENT keys offline never clobber each other —
// each key only ever competes with edits to that same key.
//
// `syncedJSON` tracks, per key, the last value both sides are known to
// agree on (set on every remote apply AND every local push) — it's the
// single source of truth used to detect and skip echoes in both directions.
export function syncKeyedCollection<V>(
  code: string,
  collectionName: string,
  getLocal: () => Record<string, V>,
  applyLocal: (next: Record<string, V>) => void
): () => void {
  const colRef = collection(db, 'households', code, collectionName)
  const syncedJSON = new Map<string, string>()
  let receivedFirst = false
  let pushTimer: ReturnType<typeof setTimeout> | undefined

  function pushDiff() {
    const local = getLocal()
    const localKeys = new Set(Object.keys(local))

    syncedJSON.forEach((_json, key) => {
      if (!localKeys.has(key)) {
        syncedJSON.delete(key)
        deleteDoc(doc(colRef, key))
      }
    })

    Object.entries(local).forEach(([key, value]) => {
      const json = JSON.stringify(value)
      if (syncedJSON.get(key) === json) return
      syncedJSON.set(key, json)
      setDoc(doc(colRef, key), value as object)
    })
  }

  const unsubscribeSnapshot = onSnapshot(colRef, (snap) => {
    if (!receivedFirst) {
      receivedFirst = true
      if (snap.empty) {
        // Fresh collection: seed it with whatever this device has locally.
        const local = getLocal()
        Object.entries(local).forEach(([key, value]) => {
          syncedJSON.set(key, JSON.stringify(value))
          setDoc(doc(colRef, key), value as object)
        })
        return
      }
      const next: Record<string, V> = {}
      snap.docs.forEach((d) => {
        next[d.id] = d.data() as V
        syncedJSON.set(d.id, JSON.stringify(next[d.id]))
      })
      applyLocal(next)
      return
    }

    let current = { ...getLocal() }
    let changed = false
    snap.docChanges().forEach((change) => {
      const key = change.doc.id
      if (change.type === 'removed') {
        if (!syncedJSON.has(key)) return // we deleted it ourselves; already reconciled
        syncedJSON.delete(key)
        delete current[key]
        changed = true
      } else {
        const value = change.doc.data() as V
        const json = JSON.stringify(value)
        if (syncedJSON.get(key) === json) return // echo of our own write
        syncedJSON.set(key, json)
        current[key] = value
        changed = true
      }
    })
    if (changed) applyLocal(current)
  })

  const unsubscribeStore = useAppStore.subscribe(() => {
    clearTimeout(pushTimer)
    pushTimer = setTimeout(pushDiff, PUSH_DEBOUNCE_MS)
  })

  return function stop() {
    unsubscribeSnapshot()
    unsubscribeStore()
    clearTimeout(pushTimer)
  }
}
