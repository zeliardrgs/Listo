import { useEffect, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAppStore } from '../store/useAppStore'
import { useHouseholdStore } from '../store/useHouseholdStore'
import { emptySyncableState, pickSyncable, type SyncableState } from '../lib/sync'

const PUSH_DEBOUNCE_MS = 400

// Keeps the app store in sync with the active household's Firestore
// document: pulls remote changes in real time (works offline too, from
// Firestore's local cache) and pushes local changes back, debounced.
// `lastRemoteJSON`/`lastPushedJSON` short-circuit the echo a write of our
// own creates when it round-trips back through onSnapshot.
export function useHouseholdSync() {
  const activeCode = useHouseholdStore((s) => s.activeCode)
  // Persists across re-renders (unlike a variable inside the effect) so we
  // can tell "switched away from a household" apart from "resumed the same
  // household after a reload" — only the former should wipe local data.
  const previousCode = useRef<string | null>(null)

  useEffect(() => {
    if (previousCode.current !== null && previousCode.current !== activeCode) {
      useAppStore.setState(emptySyncableState())
    }
    previousCode.current = activeCode

    if (!activeCode) return

    const ref = doc(db, 'households', activeCode)
    let lastRemoteJSON: string | null = null
    let lastPushedJSON: string | null = null
    let receivedFirstSnapshot = false
    let pushTimer: ReturnType<typeof setTimeout> | undefined

    const unsubscribeSnapshot = onSnapshot(ref, (snap) => {
      const data = snap.data()
      const remote = data?.appState as SyncableState | undefined
      const remoteJSON = remote ? JSON.stringify(remote) : null

      const remoteName = data?.name as string | undefined
      if (remoteName) useHouseholdStore.getState().updateName(activeCode, remoteName)

      if (!receivedFirstSnapshot) {
        receivedFirstSnapshot = true
        if (remote) {
          lastRemoteJSON = remoteJSON
          useAppStore.setState(remote)
        } else {
          // Fresh household with no shared data yet: seed it with whatever
          // this device currently has locally.
          const initial = pickSyncable(useAppStore.getState())
          lastPushedJSON = JSON.stringify(initial)
          setDoc(ref, { appState: initial }, { merge: true })
        }
        return
      }

      if (remoteJSON === lastPushedJSON) return
      lastRemoteJSON = remoteJSON
      if (remote) useAppStore.setState(remote)
    })

    const unsubscribeStore = useAppStore.subscribe((state) => {
      const syncable = pickSyncable(state)
      const json = JSON.stringify(syncable)
      if (json === lastRemoteJSON) return
      clearTimeout(pushTimer)
      pushTimer = setTimeout(() => {
        lastPushedJSON = json
        setDoc(ref, { appState: syncable }, { merge: true })
      }, PUSH_DEBOUNCE_MS)
    })

    return () => {
      unsubscribeSnapshot()
      unsubscribeStore()
      clearTimeout(pushTimer)
    }
  }, [activeCode])
}
