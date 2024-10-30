import fetch from "isomorphic-fetch"

export type Track = {
	artist: string
	title: string
	duration: number | null
	duration_estimate: number | null
	offset: number | null
	offset_estimate: number | null
}

export type SourceType = "mixcloud" | "soundcloud"

export type ShowInfo = {
	name: string
	date: Date
	tracklist: Track[]
	location: string
	image: string
	source: {
		url: string
		source: SourceType
	}
}

type Content = {
	name: string
	location_long: string
	media: {
		background_large: string
	}
	mixcloud: string
	audio_sources: {
		url: string
		source: SourceType
	}[]
	broadcast: string
	embeds: {
		tracklist: {
			results: Track[]
		}
	}
}

export async function show(url: string): Promise<ShowInfo> {
	const api = url.replace(/^(https?:\/\/)?(www\.)?nts\.live\//, "https://www.nts.live/api/v2/")
	const resp = await fetch(api, { cache: "no-cache" })
	const content = (await resp.json()) as Content

	const {
		name,
		location_long,
		media: { background_large },
		audio_sources,
		broadcast,
		embeds: {
			tracklist: { results },
		},
	} = content

	return {
		name,
		location: location_long,
		image: background_large,
		date: new Date(broadcast),
		tracklist: results,
		source: audio_sources[0],
	}
}
