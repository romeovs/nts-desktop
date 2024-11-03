import { useEffect, useState } from "react"

export function useOffline(): boolean {
	const [offline, setOffline] = useState(false)

	useEffect(function () {
		function on() {
			setOffline(false)
		}

		function off() {
			setOffline(true)
		}

		window.addEventListener("online", on)
		window.addEventListener("offline", off)

		if (!navigator.onLine) {
			off()
		}

		return function () {
			window.removeEventListener("online", on)
			window.removeEventListener("offline", off)
		}
	}, [])

	return offline
}
