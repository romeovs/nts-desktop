import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const str = import.meta.env.VITE_FIREBASE_CONFIG
const config = str && JSON.parse(str)

export default class NTS {
	constructor() {
		this.app = initializeApp(config)
		this.auth = getAuth(this.app)
	}

	firestore() {
		return getFirestore(this.app)
	}

	signIn(email, password) {
		return signInWithEmailAndPassword(this.auth, email, password)
	}
}
