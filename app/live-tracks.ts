import type { Stream } from "~/lib/stream"

export type LiveTrack = {
	title: string
	stream: Stream | null
	artists: string[]
	startTime: Date
}
