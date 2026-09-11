import { useEffect } from "react"

export function useKeydown(key: string, handler: () => void, deps: any[] = []) {
	useEffect(function () {
		function handle(evt: KeyboardEvent) {
			if (evt.key !== key) {
				return
			}

			if (evt.target !== document.body) {
				return
			}

			evt.preventDefault()
			handler()
		}

		window.addEventListener("keydown", handle)
		return () => window.removeEventListener("keydown", handle)
		// biome-ignore lint/correctness/useExhaustiveDependencies: the caller owns this array
	}, deps)
}
