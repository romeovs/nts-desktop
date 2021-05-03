import * as React from "react"

interface State<T> {
	data: T | null
	error: Error | null
	loading: boolean
}

export function usePromise<T>(fn: () => Promise<T>): State<T> {
	const [state, setState] = React.useState<State<T>>({
		data: null,
		error: null,
		loading: true,
	})

	async function refresh() {
		setState(state => ({ ...state, loading: true }))
		try {
			const data = await fn()
			setState({ loading: false, error: null, data })
		} catch (error) {
			setState({ loading: false, error, data: null })
		}
	}

	React.useEffect(function () {
		refresh()
	}, [])

	return state
}
