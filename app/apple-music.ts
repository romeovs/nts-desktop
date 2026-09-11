import { invoke } from "@tauri-apps/api/core"

export type Track = {
	artist: string
	title: string
}

const SEARCH = "https://itunes.apple.com/search"
const TIMEOUT = 8000
const THRESHOLD = 0.5

type SearchResult = {
	artistName: string
	trackName: string
	trackViewUrl: string
}

function storefront(): string {
	const locale = Intl.DateTimeFormat().resolvedOptions().locale
	const region = locale.split("-")[1]
	return (region || "US").toLowerCase()
}

function words(value: string): string[] {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.split(" ")
		.filter(Boolean)
}

function core(value: string): string[] {
	return words(
		value
			.replace(/\(.*?\)|\[.*?\]/g, " ")
			.replace(/\b(feat|ft|featuring|with|vs)\b\.?/gi, " "),
	)
}

const PLACEHOLDERS = new Set(["id", "unknown", "unknown artist", "untitled", ""])

function isPlaceholder(value: string): boolean {
	return PLACEHOLDERS.has(core(value).join(" "))
}

function recall(wanted: string[], found: string[]): number {
	if (wanted.length === 0) {
		return 0
	}

	const have = new Set(found)
	return wanted.filter((word) => have.has(word)).length / wanted.length
}

function rank(track: Track, result: SearchResult): number {
	const artist = recall(core(track.artist), words(result.artistName))
	const title = recall(core(track.title), words(result.trackName))

	if (artist < THRESHOLD || title < THRESHOLD) {
		return 0
	}

	const asked = new Set(words(track.title))
	const extra = words(result.trackName).filter((word) => !asked.has(word)).length

	return artist + title - extra / 10
}

async function search(track: Track): Promise<SearchResult | null> {
	const url = new URL(SEARCH)
	url.searchParams.set(
		"term",
		[...core(track.artist), ...core(track.title)].join(" "),
	)
	url.searchParams.set("entity", "song")
	url.searchParams.set("limit", "25")
	url.searchParams.set("country", storefront())

	const resp = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) })
	if (!resp.ok) {
		throw new Error(`iTunes search responded ${resp.status}`)
	}

	const content = await resp.json()
	const results: SearchResult[] = content.results ?? []

	let best: SearchResult | null = null
	let score = 0
	for (const result of results) {
		const current = rank(track, result)
		if (current > score) {
			best = result
			score = current
		}
	}

	return best
}

function searchURL(track: Track): string {
	const url = new URL(`https://music.apple.com/${storefront()}/search`)
	url.searchParams.set("term", `${track.artist} ${track.title}`)
	return url.href
}

function deeplink(url: string): string {
	return url.replace(/^https:\/\//, "music://")
}

export type Opened = "track" | "search"

export async function open(track: Track): Promise<Opened> {
	if (!track.artist && !track.title) {
		throw new Error("track has neither an artist nor a title")
	}

	let found: SearchResult | null = null
	try {
		if (!isPlaceholder(track.artist) && !isPlaceholder(track.title)) {
			found = await search(track)
		}
	} catch (err) {
		console.warn("apple music lookup failed:", err)
	}

	if (found) {
		await invoke("open_link", { url: deeplink(found.trackViewUrl) })
		return "track"
	}

	await invoke("open_link", { url: deeplink(searchURL(track)) })
	return "search"
}
