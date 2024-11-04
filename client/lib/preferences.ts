import { useCallback, useState } from "react"

import type { Preferences } from "~/app/preferences"
import { electron } from "~/client/electron"
import { useEvent } from "~/client/lib/use-event"

export type { Preferences }

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

	useEvent(
		"preferences",
		(prefs: Preferences) => {
			setPreferences(prefs)
		},
		[],
	)

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
