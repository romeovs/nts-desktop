import { Notification, app, shell } from "electron"
import fetch from "isomorphic-fetch"

const REPO = "romeovs/nts-desktop"
const LATEST_URL = `https://api.github.com/repos/${REPO}/releases/latest`
const RELEASES_URL = `https://github.com/${REPO}/releases`

// Wait a little after startup so the check does not compete with loading the client
const INITIAL_DELAY = 15 * 1000

// The app tends to stay in the menubar for days, so keep checking while it runs
const INTERVAL = 6 * 60 * 60 * 1000

export type Release = {
	version: string
	url: string
	downloadURL: string | null
	publishedAt: Date
}

type GitHubRelease = {
	tag_name: string
	html_url: string
	published_at: string
	assets: {
		name: string
		browser_download_url: string
	}[]
}

// Fetch the latest release from GitHub (drafts and prereleases are excluded)
export async function latest(): Promise<Release> {
	const resp = await fetch(LATEST_URL, {
		cache: "no-cache",
		headers: {
			Accept: "application/vnd.github+json",
			"User-Agent": `nts-desktop/${app.getVersion()}`,
		},
	})

	if (!resp.ok) {
		throw new Error(`GitHub responded with ${resp.status} ${resp.statusText}`)
	}

	const data: GitHubRelease = await resp.json()
	const dmg = data.assets.find((asset) => asset.name.endsWith(".dmg"))

	return {
		version: normalize(data.tag_name),
		url: data.html_url,
		downloadURL: dmg?.browser_download_url ?? null,
		publishedAt: new Date(data.published_at),
	}
}

// Compare two dotted version strings, a leading v is ignored.
// Returns a positive number when a is newer than b, negative when older, 0 when equal.
export function compare(a: string, b: string): number {
	const pa = parse(a)
	const pb = parse(b)
	const length = Math.max(pa.length, pb.length)

	for (let i = 0; i < length; i++) {
		const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
		if (diff !== 0) {
			return diff
		}
	}

	return 0
}

function normalize(version: string): string {
	return version.trim().replace(/^v/i, "")
}

function parse(version: string): number[] {
	return normalize(version)
		.split("-")[0]
		.split(".")
		.map((part) => Number.parseInt(part, 10) || 0)
}

export class Updater {
	// The newest release that is newer than the running version, if any
	available: Release | null = null

	// The version the user was last notified about, so we only nag once per session
	notified: string | null = null

	timer: ReturnType<typeof setTimeout> | null = null

	// Check shortly after startup and keep checking periodically
	start() {
		this.stop()
		this.timer = setTimeout(() => this.poll(), INITIAL_DELAY)
	}

	stop() {
		if (this.timer) {
			clearTimeout(this.timer)
			this.timer = null
		}
	}

	async poll() {
		await this.check()
		this.timer = setTimeout(() => this.poll(), INTERVAL)
	}

	// Check GitHub for a newer release. When the check was requested by the user,
	// always report the outcome, otherwise only notify about a new version once.
	async check(manual = false): Promise<Release | null> {
		const current = app.getVersion()

		let release: Release
		try {
			release = await latest()
		} catch (err) {
			console.warn("Could not check for updates:", err)
			if (manual) {
				notify("Could not check for updates", "Please try again later.")
			}
			return null
		}

		if (compare(release.version, current) <= 0) {
			this.available = null
			if (manual) {
				notify("NTS Desktop is up to date", `You are running version ${current}.`)
			}
			return null
		}

		this.available = release

		if (manual || this.notified !== release.version) {
			this.notified = release.version
			notify(
				"NTS Desktop update available",
				`Version ${release.version} is ready to download. Click to open the release.`,
				() => this.open(),
			)
		}

		return release
	}

	// Open the release page for the available update, or the releases overview
	open() {
		shell.openExternal(this.available?.url ?? RELEASES_URL)
	}
}

function notify(title: string, body: string, onClick?: () => void) {
	if (!Notification.isSupported()) {
		console.log(`${title}: ${body}`)
		return
	}

	const notification = new Notification({ title, body, silent: true })
	if (onClick) {
		notification.on("click", onClick)
	}
	notification.show()
}
