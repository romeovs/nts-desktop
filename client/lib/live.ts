import { useCallback, useEffect, useRef, useState } from "react"
import { useEvent } from "./use-event"

export type ChannelInfo = {
	now: ShowInfo
	next: ShowInfo | null
}

export type ShowInfo = {
	name: string
	starts: Date
	ends: Date
	location: string
	image: string
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
		channel1: result({
			now: simplify(content.results[0].now),
			next: simplify(content.results[0].next),
		}),
		channel2: result({
			now: simplify(content.results[1].now),
			next: simplify(content.results[1].next),
		}),
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
		next: null,
	}
}

type ShowData = {
	start_timestamp: string
	end_timestamp: string
	embeds: {
		details: {
			name: string
			location_long: string
			media: {
				background_large: string
			}
		}
	}
}

function simplify(data: ShowData): ShowInfo {
	const {
		start_timestamp,
		end_timestamp,
		embeds: {
			details: {
				name,
				location_long,
				media: { background_large },
			},
		},
	} = data

	return {
		name,
		location: location_long,
		image: background_large,
		starts: new Date(start_timestamp),
		ends: new Date(end_timestamp),
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
				if (!state.data || !state.data.channel1.next || !state.data.channel2.next) {
					return state
				}

				return {
					...state,
					data: {
						channel1: {
							now: state.data.channel1.next,
							next: null,
						},
						channel2: {
							now: state.data.channel2.next,
							next: null,
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

			const t = setTimeout(next, soonest + 1)
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
