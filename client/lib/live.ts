import { useCallback, useEffect, useRef, useState } from "react"
import { useEvent } from "./use-event"

export type ChannelInfo = {
	now: ShowInfo
	next: ShowInfo | null
	upcoming: ShowInfo[]
}

export type ShowInfo = {
	name: string
	starts: Date
	ends: Date
	location: string
	image: string
	show: string
	episode: string
}

export type Info = {
	channel1: ChannelInfo
	channel2: ChannelInfo
}
export type InfoState = {
	loading: boolean
	data: Info | null
	error: Error | null
}

type LiveOptions = {
	signal?: AbortSignal
}

export async function live(options: LiveOptions): Promise<Info> {
	const resp = await fetch("https://www.nts.live/api/v2/live", {
		cache: "no-cache",
		signal: options.signal,
	})

	const content = await resp.json()

	return {
		channel1: result(channel(content.results[0])),
		channel2: result(channel(content.results[1])),
	}
}

// The live endpoint carries the rest of the day as next, next2 ... next17, which
// is the schedule - no second request needed for it.
function channel(data: Record<string, ShowData>): ChannelInfo {
	const upcoming: ShowInfo[] = []
	for (let i = 1; i <= 17; i++) {
		const key = i === 1 ? "next" : `next${i}`
		const entry = data[key]
		if (!entry) {
			continue
		}
		upcoming.push(simplify(entry))
	}

	return {
		now: simplify(data.now),
		next: upcoming[0] ?? null,
		upcoming,
	}
}

function result(info: ChannelInfo): ChannelInfo {
	if (info.now.ends.getTime() > Date.now()) {
		return info
	}

	if (!info.next) {
		return info
	}

	return {
		now: info.next,
		next: info.upcoming[1] ?? null,
		upcoming: info.upcoming.slice(1),
	}
}

// Only the show on air and the one after it come with details attached. The
// rest of the day arrives as a title and a pair of timestamps, which is all a
// schedule needs.
type ShowData = {
	broadcast_title?: string
	start_timestamp: string
	end_timestamp: string
	embeds?: {
		details?: {
			name?: string
			location_long?: string
			show_alias?: string
			episode_alias?: string
			media?: {
				background_large?: string
			}
		}
	}
}

function simplify(data: ShowData): ShowInfo {
	const details = data.embeds?.details

	return {
		name: details?.name ?? data.broadcast_title ?? "",
		location: details?.location_long ?? "",
		image: details?.media?.background_large ?? "",
		show: details?.show_alias ?? "",
		episode: details?.episode_alias ?? "",
		starts: new Date(data.start_timestamp),
		ends: new Date(data.end_timestamp),
	}
}

type Options = {
	skip?: boolean
}

export function useLiveInfo(options: Options): InfoState {
	const [state, setState] = useState<InfoState>({
		loading: true,
		data: null,
		error: null,
	})
	const abort = useRef<AbortController | null>(null)

	const load = useCallback(async function () {
		abort.current?.abort()
		abort.current = new AbortController()

		setState((state) => ({ ...state, loading: true, error: null }))

		const data = await live({ signal: abort.current.signal })
		if (abort.current.signal.aborted) {
			throw new Error("aborted")
		}

		setState({ loading: false, data, error: null })
	}, [])

	useEffect(
		function () {
			if (options.skip) {
				return
			}

			load()
		},
		[load, options.skip],
	)

	const next = useCallback(
		function () {
			setState(function (state) {
				if (!state.data?.channel1.next || !state.data.channel2.next) {
					return state
				}

				return {
					...state,
					data: {
						channel1: {
							now: state.data.channel1.next,
							next: state.data.channel1.upcoming[1] ?? null,
							upcoming: state.data.channel1.upcoming.slice(1),
						},
						channel2: {
							now: state.data.channel2.next,
							next: state.data.channel2.upcoming[1] ?? null,
							upcoming: state.data.channel2.upcoming.slice(1),
						},
					},
				}
			})
			load()
		},
		[load],
	)

	useEffect(
		function () {
			if (options.skip) {
				return
			}
			const now = Date.now()
			const ch1 =
				(state.data?.channel1.now.ends.getTime() ?? Number.POSITIVE_INFINITY) - now
			const ch2 =
				(state.data?.channel2.now.ends.getTime() ?? Number.POSITIVE_INFINITY) - now
			const soonest = Math.min(ch1, ch2)
			if (!Number.isFinite(soonest)) {
				return
			}

			if (soonest < 0) {
				if (!state.data && !state.loading) {
					next()
				}
				return
			}

			const t = setTimeout(next, soonest + 500)
			return () => clearTimeout(t)
		},
		[next, state.data, state.loading, options.skip],
	)

	useEvent("open", async function () {
		load()
	})

	return {
		loading: state.loading,
		data: state.data,
		error: state.error,
	}
}
