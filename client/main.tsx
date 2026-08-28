import { createRoot } from "react-dom/client"

import { App } from "~/client/app"
import { ipc } from "~/client/ipc"
import "~/client/lib/firebase"
import { type Preferences, PreferencesProvider } from "~/client/lib/preferences"

ipc.once("preferences", function render(_: Event, preferences: Preferences) {
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
ipc.send("init")
