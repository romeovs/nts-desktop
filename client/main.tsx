import { createRoot } from "react-dom/client"

import { App } from "~/client/app"
import { electron } from "~/client/electron"
import { type Preferences, PreferencesProvider } from "~/client/lib/preferences"

electron.once("preferences", function render(_: Event, preferences: Preferences) {
	const root = document.getElementById("root")
	if (!root) {
		return
	}

	const app = (
		<PreferencesProvider preferences={preferences}>
			<App />
		</PreferencesProvider>
	)

	createRoot(root).render(app)
})
electron.send("init")
