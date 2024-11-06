import { useState } from "react"

import type { LiveTrack } from "~/app/live-tracks"
import type { Stream } from "~/lib/stream"

import { useEvent } from "./use-event"

export function useLiveTracks(stream: Stream) {
	const [tracks, setTracks] = useState<LiveTrack[]>([])

	useEvent(
		`live-tracks-${stream}`,
		function (tracks: LiveTrack[]) {
			setTracks(tracks)
		},
		[],
	)

	return tracks
}
