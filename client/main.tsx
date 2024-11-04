import DOM from "react-dom"

import { App } from "~/client/app"
import { electron } from "~/client/electron"
import { type Preferences, PreferencesProvider } from "~/client/lib/preferences"

function render(_: Event, preferences: Preferences) {
	electron.removeAllListeners("preferences")

	const root = document.getElementById("root")
	const app = (
		<PreferencesProvider preferences={preferences}>
			<App />
		</PreferencesProvider>
	)

	DOM.render(app, root)
}

electron.on("preferences", render)
electron.send("init")
