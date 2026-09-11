import { type FirebaseOptions, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Injected by Vite from the public Firebase config in .env. Null when that
// config could not be recovered, in which case the live tracklist stays
// unavailable. See scripts/firebase-config.mjs.
const config: FirebaseOptions | null = FIREBASE_CONFIG

const app = config ? initializeApp(config) : null

export const auth = app ? getAuth(app) : null
export const store = app ? getFirestore(app) : null
