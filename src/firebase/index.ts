import {
	collection,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"
import NTS from "./mod"

const LIMIT = 15

const nts = new NTS()
const store = nts.firestore()

export type LiveTrack = {
	title: string
	stream: 1 | 2 | null
	artists: string[]
	startTime: Date
}

function streamToPathname(stream: 1 | 2): string {
	if (stream === 1) {
		return "/stream"
	}
	if (stream === 2) {
		return "/stream2"
	}
	return "unknown"
}

function pathnameToStream(pathname: string): 1 | 2 | null {
	if (pathname === "/stream") {
		return 1
	}
	if (pathname === "/stream2") {
		return 2
	}
	return null
}

type Handler = (err: Error | null, res: LiveTrack[] | null) => void

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

let promise: Promise<void> | null = null

export async function login(email: string, password: string) {
	if (!promise) {
		promise = nts.signIn(email, password)
	}

	return promise
}

import { useEffect, useState } from "react"

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
	stream: 1 | 2 | null
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
		[stream, loggedIn, stream],
	)
	return tracks
}
