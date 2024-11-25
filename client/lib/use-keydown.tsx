import { useEffect } from "react"

export function useKeydown(key: string, handler: () => void, deps: any[] = []) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: we're using a dep array here
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
	}, deps)
}
