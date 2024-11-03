import { type FirebaseApp, initializeApp } from "firebase/app"
import { type Auth, getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// @ts-expect-error
const str: string = import.meta.env.VITE_FIREBASE_CONFIG
const config = str && JSON.parse(str)

export default class NTS {
	app: FirebaseApp
	auth: Auth

	constructor() {
		this.app = initializeApp(config)
		this.auth = getAuth(this.app)
	}

	firestore() {
		return getFirestore(this.app)
	}

	signIn(email: string, password: string) {
		return signInWithEmailAndPassword(this.auth, email, password)
	}
}
