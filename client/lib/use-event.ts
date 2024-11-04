import { useEffect } from "react"
import { electron } from "../electron"

export function useEvent<A>(
	name: string,
	handler: (...args: A[]) => void,
	deps: any[] = [],
) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: we're using a dep array here
	useEffect(function () {
		function handle(_evt: Event, ...args: A[]) {
			handler(...args)
		}

		electron.on(name, handle)
		// TODO: we should be able to use removeEventListener here, but it does not seem to work.
		return () => electron.removeAllListeners(name)
	}, deps)
}
