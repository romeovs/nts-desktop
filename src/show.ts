import fetch from "isomorphic-fetch"

export type Track = {
	artist: string
	title: string
}

export type Show = {
	name: string
	date: Date
	mixcloud: string
	tracklist: Track[]
	location: string
	image: string
}

type Content = {
	name: string
	location_long: string
	media: {
		background_large: string
	}
	mixcloud: string
	broadcast: string
	embeds: {
		tracklist: {
			results: Track[]
		}
	}
}

export async function show(url: string): Promise<Show> {
	const api = url.replace(/^(https?:\/\/)?(www\.)?nts\.live\//, "https://www.nts.live/api/v2/")
	const resp = await fetch(api, { cache: "no-cache" })
	const content = (await resp.json()) as Content

	const {
		name,
		location_long,
		media: { background_large },
		mixcloud,
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
		mixcloud,
	}
}
