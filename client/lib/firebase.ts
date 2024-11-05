import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"
import {
	collection,
	getFirestore,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"
import { useEffect, useState } from "react"

import { type Stream, pathnameToStream, streamToPathname } from "./stream"

const LIMIT = 15

// @ts-expect-error
const str: string = import.meta.env.VITE_FIREBASE_CONFIG
const config = str && JSON.parse(str)

const app = initializeApp(config)
const auth = getAuth(app)
const store = getFirestore(app)

export type LiveTrack = {
	title: string
	stream: Stream | null
	artists: string[]
	startTime: Date
}

type Handler = (err: Error | null, res: LiveTrack[] | null) => void

function signIn(email: string, password: string) {
	return signInWithEmailAndPassword(auth, email, password)
}

function liveTracks(stream: 1 | 2, fn: Handler): () => void {
	const qry = query(
		collection(store, "live_tracks"),
		where("stream_pathname", "==", streamToPathname(stream)),
		orderBy("start_time", "desc"),
		limit(LIMIT),
	)

	return onSnapshot(
		qry,
		function (snapshot) {
			const res: LiveTrack[] = []
			// biome-ignore lint/complexity/noForEach: we can't use for of here
			snapshot.forEach(function (doc) {
				const data = doc.data()
				res.push({
					title: data.song_title,
					artists: data.artist_names,
					stream: pathnameToStream(data.stream_pathname),
					startTime: data.start_time.toDate(),
				})
			})
			fn(null, res)
		},
		function (err) {
			fn(err, null)
		},
	)
}

const promises: { [creds: string]: Promise<any> } = {}

export async function login(email: string, password: string) {
	const key = `${email}:${password}`
	if (!promises[key]) {
		promises[key] = signIn(email, password)
	}

	return promises[key]
}

function useLogin(username: string | null, password: string | null) {
	const [loggedIn, setLoggedIn] = useState(false)
	useEffect(
		function () {
			if (!username || !password) {
				return
			}

			login(username, password).then(() => setLoggedIn(true))
		},
		[username, password],
	)
	return loggedIn
}

type Options = {
	email: string | null
	password: string | null
	stream: Stream | null
	paused: boolean
}

export function useLiveTracks(options: Options): LiveTrack[] {
	const { email, password, stream, paused } = options
	const loggedIn = useLogin(email, password)
	const [tracks, setTracks] = useState<LiveTrack[]>([])

	useEffect(
		function () {
			if (!loggedIn || paused || !stream) {
				return
			}
			return liveTracks(stream, function (err, res) {
				if (err) {
					return
				}
				setTracks(res ?? [])
			})
		},
		[stream, loggedIn, paused],
	)
	return tracks
}
