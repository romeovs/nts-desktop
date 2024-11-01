import { useCallback, useEffect, useState } from "react"

import type { Preferences } from "../../preferences"
import { electron } from "../electron"

export { Preferences }

export const preferences = read()

function read() {
	try {
		return JSON.parse(decodeURIComponent(location.search.substring(3)))
	} catch (err) {
		return { volume: 0.8 }
	}
}

export function usePreferences(): [
	Preferences,
	(fn: (prefs: Preferences) => Preferences) => void,
] {
	const [preferences, setPreferences] = useState<Preferences>(read())

	useEffect(function () {
		function handler(_evt: Event, prefs: Preferences) {
			setPreferences(prefs)
		}
		electron.on("preferences", handler)
		return () => electron.removeListener("preferences", handler)
	}, [])

	const setter = useCallback(
		function (fn: (prefs: Preferences) => Preferences) {
			if (!preferences) {
				return
			}

			setPreferences(function (preferences: Preferences) {
				const prefs = fn(preferences)
				electron.send("preferences", prefs)
				history.replaceState(null, "", `?p=${JSON.stringify(prefs)}`)
				return prefs
			})
		},
		[preferences],
	)

	return [preferences, setter]
}
