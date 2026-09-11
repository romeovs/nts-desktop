import { useEffect } from "react"
import { electron } from "../electron"

export function useEvent<A>(
	name: string,
	handler: (...args: A[]) => void,
	deps: any[] = [],
) {
	useEffect(function () {
		function handle(_evt: Event, ...args: A[]) {
			handler(...args)
		}

		return electron.addListener(name, handle)
		// biome-ignore lint/correctness/useExhaustiveDependencies: the caller owns this array
	}, deps)
}
