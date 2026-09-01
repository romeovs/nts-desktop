import {
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react"

import * as commands from "~/client/lib/commands"

export type Preferences = {
	volume: number
}

type PreferencesContext = {
	preferences: Preferences
	updatePreferences: (fn: (prefs: Preferences) => Preferences) => void
	setPreferences: (prefs: Preferences) => void
}

type ProviderProps = PropsWithChildren<{
	preferences: Preferences
}>

const context = createContext<PreferencesContext | null>(null)

export function PreferencesProvider(props: ProviderProps) {
	const [preferences, _setPreferences] = useState<Preferences>(props.preferences)

	const setPreferences = useCallback(function (prefs: Preferences) {
		updatePreferences((_) => prefs)
	}, [])

	const updatePreferences = useCallback(function (
		fn: (prefs: Preferences) => Preferences,
	) {
		_setPreferences(function (preferences: Preferences) {
			const prefs = fn(preferences)
			commands.setPreferences(prefs)
			return prefs
		})
	}, [])

	const ctx = {
		preferences,
		setPreferences,
		updatePreferences,
	}

	return <context.Provider value={ctx}>{props.children}</context.Provider>
}

export function usePreferences(): PreferencesContext {
	const ctx = useContext(context)
	if (!ctx) {
		throw new Error("usePreferences must be used within a PreferencesProvider")
	}
	return ctx
}
