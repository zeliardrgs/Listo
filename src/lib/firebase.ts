import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyATP6skuvqwvV0ps2yPKaWCp75UCj7px0k',
  authDomain: 'listo-11570.firebaseapp.com',
  projectId: 'listo-11570',
  storageBucket: 'listo-11570.firebasestorage.app',
  messagingSenderId: '960387707388',
  appId: '1:960387707388:web:49503dfc4372caf265c279'
}

const app = initializeApp(firebaseConfig)

// persistentLocalCache keeps a copy of Firestore data on-device (IndexedDB) so
// the app keeps working (read + write) without a connection; queued writes
// sync automatically once the network comes back.
export const db = initializeFirestore(app, { localCache: persistentLocalCache({}) })
