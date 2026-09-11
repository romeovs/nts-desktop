import { invoke } from "@tauri-apps/api/core"
import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event"

import * as appleMusic from "~/app/apple-music"
import * as favourites from "~/app/favourites"
import { type ShowInfo, show } from "~/app/show"
import * as session from "~/client/lib/session"

interface Host {
	once(name: string, callback: (evt: Event, ...args: any[]) => void): void
	addListener(
		name: string,
		callback: (evt: Event, ...args: any[]) => void,
	): () => void
	removeAllListeners(name: string): void
	send(name: string, ...args: any[]): void
	invoke(name: string, ...args: any[]): Promise<any>
}

const local = new EventTarget()
const unlistens = new Map<string, UnlistenFn[]>()

function publish(name: string, ...args: any[]) {
	local.dispatchEvent(new CustomEvent(name, { detail: args }))
}

function deliver(
	callback: (evt: Event, ...args: any[]) => void,
	name: string,
	payload: unknown,
) {
	if (payload === undefined || payload === null) {
		callback(new Event(name))
		return
	}
	callback(new Event(name), payload)
}

async function openShow(url: string) {
	if (!url.startsWith("https://www.nts.live/shows/")) {
		throw new Error("Please use a valid NTS show URL")
	}

	const data = await show(url)
	await invoke("history_add", { name: data.name, url })
	publish("open-show", reviveShow(data))
}

function reviveShow(data: ShowInfo): ShowInfo {
	return {
		...data,
		date: data.date instanceof Date ? data.date : new Date(data.date),
	}
}

export const electron: Host = {
	once(name, callback) {
		const stop = electron.addListener(name, function handler(evt, ...args) {
			stop()
			callback(evt, ...args)
		})
	},

	addListener(name, callback) {
		const onLocal = (evt: Event) => {
			const detail = (evt as CustomEvent).detail as unknown[]
			callback(evt, ...detail)
		}
		local.addEventListener(name, onLocal)

		const pending = listen(name, (event) => {
			const payload =
				name === "open-show" ? reviveShow(event.payload as ShowInfo) : event.payload
			deliver(callback, name, payload)
		})
		pending.then((unlisten) => {
			const current = unlistens.get(name) ?? []
			current.push(unlisten)
			unlistens.set(name, current)
		})

		return () => {
			local.removeEventListener(name, onLocal)
			pending.then((unlisten) => {
				unlisten()
				const current = (unlistens.get(name) ?? []).filter(
					(item) => item !== unlisten,
				)
				unlistens.set(name, current)
			})
		}
	},

	removeAllListeners(name) {
		for (const unlisten of unlistens.get(name) ?? []) {
			unlisten()
		}
		unlistens.delete(name)
	},

	send(name, ...args) {
		switch (name) {
			case "init":
				void invoke<import("~/app/preferences").Preferences>("init").then(
					(prefs) => {
						publish("preferences", prefs)
					},
				)
				return
			case "close":
				void invoke("hide_window")
				return
			case "playing":
				void invoke("set_playing", { channel: args[0] ?? null })
				return
			case "preferences":
				void invoke("write_preferences", { preferences: args[0] })
				return
			case "open-show-url":
				void openShow(args[0]).catch((err) => {
					console.warn(err)
				})
				return
			case "open-link":
				void invoke("open_link", { url: args[0] })
				return
			default:
				void emit(name, args[0])
		}
	},

	async invoke(name, ...args) {
		switch (name) {
			case "version":
				return invoke("version")
			case "apple-music":
				return appleMusic.open(args[0])
			case "favourite":
				if (!(await session.ensureAuth())) {
					throw new Error("sign in to NTS to save favourites")
				}
				return favourites.toggle(args[0])
			case "is-favourite":
				if (!(await session.ensureAuth())) {
					return false
				}
				return favourites.has(args[0])
			case "favourites":
				if (!(await session.ensureAuth())) {
					throw new Error("sign in to NTS to see your favourites")
				}
				return favourites.list()
			case "episodes":
				return favourites.episodes(args[0], args[1], 10)
			case "login-credentials":
				return session.login(args[0].email, args[0].password)
			case "remind":
				return invoke("remind", { reminder: args[0] })
			case "reminders":
				return invoke("reminders_list")
			default:
				return invoke(name, args[0])
		}
	},
}

electron.addListener("open", () => {
	void session.subscribe()
})
electron.addListener("close", () => {
	session.unsubscribe()
})
electron.addListener("logout", () => {
	void session.onNativeLogout()
})
electron.addListener("open-show-url", (_evt, url: string) => {
	void openShow(url).catch((err) => console.warn(err))
})
