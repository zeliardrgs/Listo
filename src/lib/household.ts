import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// Avoids visually ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

function randomCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

// Looks up a household by code, returning its display name when it exists
// (used both to validate a code before joining and to show the name).
export async function fetchHouseholdName(code: string): Promise<string | null> {
  const snap = await getDoc(doc(db, 'households', code))
  if (!snap.exists()) return null
  return (snap.data().name as string) || code
}

// Creates a new household with a fresh random code, retrying on the rare
// collision with an existing code.
export async function createHousehold(name: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const ref = doc(db, 'households', code)
    const snap = await getDoc(ref)
    if (snap.exists()) continue
    await setDoc(ref, { createdAt: serverTimestamp(), name: name.trim() || code })
    return code
  }
  throw new Error('Impossible de générer un code de foyer, réessaie.')
}

export async function renameHousehold(code: string, name: string): Promise<void> {
  await setDoc(doc(db, 'households', code), { name: name.trim() || code }, { merge: true })
}
