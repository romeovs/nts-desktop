import { useCallback, useState } from "react"

interface State<T> {
	data: T | null
	error: Error | null
	loading: boolean
}

export interface PromiseState<A, T> extends State<T> {
	load: (...args: A[]) => Promise<void>
}

export function usePromise<A, T>(
	fn: (...args: A[]) => Promise<T>,
	initialLoading = true,
): PromiseState<A, T> {
	const [state, setState] = useState<State<T>>({
		data: null,
		error: null,
		loading: initialLoading,
	})

	const load = useCallback(
		async function (...args: A[]): Promise<void> {
			setState((state) => ({ ...state, loading: true }))
			try {
				const data = await fn(...args)
				setState({ loading: false, error: null, data })
			} catch (error) {
				if (error instanceof Error) {
					setState({ loading: false, error, data: null })
					return
				}

				setState({
					loading: false,
					error: new Error("Something went wrong"),
					data: null,
				})
			}
		},
		[fn],
	)

	return {
		...state,
		load,
	}
}
