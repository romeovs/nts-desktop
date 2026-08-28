import { invoke } from "@tauri-apps/api/core"
import { listen, once } from "@tauri-apps/api/event"

type Handler = (evt: Event, ...args: any[]) => void

/**
 * Registering a listener is asynchronous in Tauri, but the client expects the
 * synchronous semantics of ipcRenderer. Sends wait for every listener
 * registered before them, so a reply can never arrive before its listener.
 */
let registered: Promise<unknown> = Promise.resolve()

function track<T>(promise: Promise<T>): Promise<T> {
	registered = registered.then(() => promise).catch(() => undefined)
	return promise
}

/**
 * The bridge to the Rust side.
 *
 * Client to Rust goes over invoke, so an event never loops back into the
 * webview that sent it. Rust to client goes over emit.
 */
export const ipc = {
	send(name: string, arg?: unknown): void {
		registered.then(function () {
			invoke(name.replace(/-/g, "_"), { payload: arg ?? null }).catch(
				function (err) {
					console.warn(`ipc.send(${name}) failed`, err)
				},
			)
		})
	},

	addListener(name: string, callback: Handler): () => void {
		let unlisten: (() => void) | null = null
		let cancelled = false

		track(
			listen(name, function (event) {
				callback(new Event(name), event.payload)
			}),
		).then(function (fn) {
			if (cancelled) {
				fn()
				return
			}
			unlisten = fn
		})

		return function () {
			cancelled = true
			unlisten?.()
		}
	},

	once(name: string, callback: Handler): void {
		track(
			once(name, function (event) {
				callback(new Event(name), event.payload)
			}),
		)
	},
}
