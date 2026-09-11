import { useEffect, useState } from "react"

import type { LiveTrack } from "~/app/live-tracks"
import type { Stream } from "~/lib/stream"

import { onLiveTracks } from "./session"

export function useLiveTracks(stream: Stream) {
	const [tracks, setTracks] = useState<LiveTrack[]>([])

	useEffect(() => onLiveTracks(stream, setTracks), [stream])

	return tracks
}
