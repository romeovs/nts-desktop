import { listen } from "@tauri-apps/api/event"
import { useEffect } from "react"

/**
 * Subscribe to an event emitted by the Rust side. Registering is asynchronous,
 * so a subscription that is torn down before it completes is dropped again.
 */
export function useEvent<T>(
	name: string,
	handler: (payload: T) => void,
	deps: unknown[] = [],
) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: we're using a dep array here
	useEffect(function () {
		let unlisten: (() => void) | null = null
		let cancelled = false

		listen<T>(name, (event) => handler(event.payload)).then(function (fn) {
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
	}, deps)
}
