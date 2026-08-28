import { type FirebaseOptions, initializeApp } from "firebase/app"
import {
	type User,
	getAuth,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { useEffect, useState } from "react"

import { ipc } from "~/client/ipc"
import { notify } from "~/client/notifications"

export type Credentials = {
	email: string
	password: string
}

// @ts-expect-error: defined by the build
const config: FirebaseOptions = FIREBASE_CONFIG

const app = initializeApp(config)

export const auth = getAuth(app)
export const store = getFirestore(app)

export async function login(credentials: Credentials): Promise<void> {
	const { email, password } = credentials
	await signInWithEmailAndPassword(auth, email, password)
}

ipc.addListener(
	"credentials",
	async function (_evt: Event, credentials: Credentials | null) {
		if (!credentials) {
			return
		}

		try {
			await login(credentials)
		} catch (err) {
			notify({ message: "could not log in", ttl: 4000, type: "error" })
		}
	},
)

ipc.addListener("logout", function () {
	signOut(auth)
})

export function useUser(): User | null {
	const [user, setUser] = useState<User | null>(auth.currentUser)

	useEffect(function () {
		return onAuthStateChanged(auth, setUser)
	}, [])

	return user
}
