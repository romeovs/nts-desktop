import { createRoot } from "react-dom/client"

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

	createRoot(root).render(app)
}

electron.addListener("preferences", render)
electron.send("init")
