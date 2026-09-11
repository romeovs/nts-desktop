import { invoke } from "@tauri-apps/api/core"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import {
	collection,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"
import { auth, store } from "~/app/firebase"
import type { LiveTrack } from "~/app/live-tracks"
import { pathnameToStream, streamToPathname } from "~/lib/stream"

const LIMIT = 15

type Handler = (tracks: LiveTrack[]) => void

const listeners: { 1: Set<Handler>; 2: Set<Handler> } = {
	1: new Set(),
	2: new Set(),
}

let unsub: (() => void) | null = null
let ready: Promise<boolean> | null = null
let subscribing = false

export function onLiveTracks(stream: 1 | 2, handler: Handler): () => void {
	listeners[stream].add(handler)
	return () => {
		listeners[stream].delete(handler)
	}
}

export async function ensureAuth(): Promise<boolean> {
	if (!ready) {
		ready = readAndAuth()
	}

	const ok = await ready
	if (!ok) {
		ready = null
	}
	return ok
}

async function readAndAuth(): Promise<boolean> {
	const creds = await invoke<{ email: string; password: string } | null>(
		"credentials_read",
	)
	if (!creds || !auth) {
		return false
	}

	try {
		await signInWithEmailAndPassword(auth, creds.email, creds.password)
		return true
	} catch (err) {
		console.warn("could not sign in to NTS:", err)
		return false
	}
}

export async function login(email: string, password: string): Promise<boolean> {
	if (!auth) {
		throw new Error("live tracklist is unavailable in this build")
	}

	await signInWithEmailAndPassword(auth, email, password)
	await invoke("credentials_write", { credentials: { email, password } })
	ready = Promise.resolve(true)
	await subscribe()
	return true
}

export async function onNativeLogout(): Promise<void> {
	unsubscribe()
	ready = null
	if (auth) {
		await signOut(auth)
	}
}

export async function subscribe(): Promise<void> {
	if (unsub || subscribing) {
		return
	}

	subscribing = true
	try {
		if (!(await ensureAuth()) || !store) {
			return
		}

		const stop1 = watch(1)
		const stop2 = watch(2)
		unsub = () => {
			stop1()
			stop2()
			unsub = null
		}
	} finally {
		subscribing = false
	}
}

export function unsubscribe(): void {
	unsub?.()
	unsub = null
}

function watch(stream: 1 | 2): () => void {
	if (!store) {
		return () => {}
	}

	const qry = query(
		collection(store, "live_tracks"),
		where("stream_pathname", "==", streamToPathname(stream)),
		orderBy("start_time", "desc"),
		limit(LIMIT),
	)

	return onSnapshot(qry, (snapshot) => {
		const tracks: LiveTrack[] = []
		snapshot.forEach(function (doc) {
			const data = doc.data()
			tracks.push({
				title: data.song_title,
				artists: data.artist_names,
				stream: pathnameToStream(data.stream_pathname),
				startTime: data.start_time.toDate(),
			})
		})
		for (const handler of listeners[stream]) {
			handler(tracks)
		}
	})
}
