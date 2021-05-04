import * as React from "react"

interface State<T> {
	data: T | null
	error: Error | null
	loading: boolean
}

export interface PromiseState<A, T> extends State<T> {
	load: (...args: A[]) => Promise<void>
}

export function usePromise<A, T>(fn: (...args: A[]) => Promise<T>, initialLoading: boolean = true): PromiseState<A, T> {
	const [state, setState] = React.useState<State<T>>({
		data: null,
		error: null,
		loading: initialLoading,
	})

	async function load(...args: A[]): Promise<void> {
		setState(state => ({ ...state, loading: true }))
		try {
			const data = await fn(...args)
			setState({ loading: false, error: null, data })
		} catch (error) {
			setState({ loading: false, error, data: null })
		}
	}

	return {
		...state,
		load,
	}
}
