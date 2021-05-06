import { usePromise, PromiseState } from "./use-promise"

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

export async function live(): Promise<Info> {
	const resp = await fetch("https://www.nts.live/api/v2/live", { cache: "no-cache" })
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

export function useLiveInfo(): PromiseState<never, Info> {
	return usePromise(live)
}
