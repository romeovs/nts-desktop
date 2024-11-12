import { useCallback, useEffect, useRef, useState } from "react"

export type ChannelInfo = {
	now: ShowInfo
	next: ShowInfo
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
		channel1: {
			now: simplify(content.results[0].now),
			next: simplify(content.results[0].next),
		},
		channel2: {
			now: simplify(content.results[1].now),
			next: simplify(content.results[1].next),
		},
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
				load()
				return
			}

			const t = setTimeout(load, soonest)
			return () => clearTimeout(t)
		},
		[load, state.data, options.skip],
	)

	return {
		loading: state.loading,
		data: state.data,
		error: state.error,
	}
}
