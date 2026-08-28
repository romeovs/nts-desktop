import {
	type DocumentData,
	type QuerySnapshot,
	collection,
	limit,
	onSnapshot,
	orderBy,
	query,
	where,
} from "firebase/firestore"
import { useEffect, useState } from "react"

import { type Stream, pathnameToStream, streamToPathname } from "~/lib/stream"

import { store, useUser } from "./firebase"

const LIMIT = 15

export type LiveTrack = {
	title: string
	stream: Stream | null
	artists: string[]
	startTime: Date
}

function toTracks(snapshot: QuerySnapshot<DocumentData, DocumentData>): LiveTrack[] {
	const tracks: LiveTrack[] = []
	// biome-ignore lint/complexity/noForEach: we can't use for of here
	snapshot.forEach(function (doc) {
		const data = doc.data()
		tracks.push({
			title: data.song_title,
			artists: data.artist_names,
			stream: pathnameToStream(data.stream_pathname),
			startTime: data.start_time.toDate(),
		})
	})
	return tracks
}

export function useLiveTracks(stream: Stream, isOpen: boolean): LiveTrack[] {
	const [tracks, setTracks] = useState<LiveTrack[]>([])
	const user = useUser()

	useEffect(
		function () {
			if (!isOpen || !user) {
				return
			}

			const qry = query(
				collection(store, "live_tracks"),
				where("stream_pathname", "==", streamToPathname(stream)),
				orderBy("start_time", "desc"),
				limit(LIMIT),
			)

			return onSnapshot(
				qry,
				(snapshot) => setTracks(toTracks(snapshot)),
				(err) => console.warn(err),
			)
		},
		[stream, isOpen, user],
	)

	return tracks
}
