import { useCallback, useState } from "react"

import type { Preferences } from "~/app/preferences"
import { electron } from "~/client/electron"
import { useEvent } from "~/client/lib/use-event"

export type { Preferences }

export function usePreferences(
	initial: Preferences,
): [Preferences, (fn: (prefs: Preferences) => Preferences) => void] {
	const [preferences, setPreferences] = useState<Preferences>(initial)

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
