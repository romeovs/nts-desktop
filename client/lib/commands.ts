import { invoke } from "@tauri-apps/api/core"

import type { Stream } from "~/lib/stream"

import type { Credentials } from "./firebase"
import type { Preferences } from "./preferences"

export type Channel = Stream | "show"

export type Entry = {
	name: string
	url: string
}

export type Init = {
	preferences: Preferences
	credentials: Credentials | null
}

export const init = () => invoke<Init>("init")

export const close = () => invoke("close")
export const myNts = () => invoke("my_nts")
export const explore = () => invoke("explore")

export const playing = (channel: Channel | null) => invoke("playing", { channel })
export const tracklist = (channel: Channel) => invoke("tracklist", { channel })
export const chat = (channel: Channel) => invoke("chat", { channel })

export const setPreferences = (preferences: Preferences) =>
	invoke("set_preferences", { preferences })

export const storeCredentials = (credentials: Credentials) =>
	invoke("store_credentials", { credentials })

export const addHistory = (entry: Entry) => invoke("add_history", { entry })
