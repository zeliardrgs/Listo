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

export async function householdExists(code: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'households', code))
  return snap.exists()
}

// Creates a new household with a fresh random code, retrying on the rare
// collision with an existing code.
export async function createHousehold(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode()
    const ref = doc(db, 'households', code)
    const snap = await getDoc(ref)
    if (snap.exists()) continue
    await setDoc(ref, { createdAt: serverTimestamp() })
    return code
  }
  throw new Error('Impossible de générer un code de foyer, réessaie.')
}
