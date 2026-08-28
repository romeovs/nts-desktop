import { useEffect } from "react"
import { ipc } from "../ipc"

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

		return ipc.addListener(name, handle)
	}, deps)
}
