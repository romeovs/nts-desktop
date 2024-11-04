import DOM from "react-dom"

import type { Preferences } from "~/app/preferences"
import { App } from "~/client/app"
import { electron } from "~/client/electron"

function render(_: Event, preferences: Preferences) {
	electron.removeAllListeners("preferences")

	const root = document.getElementById("root")
	DOM.render(<App preferences={preferences} />, root)
}

electron.on("preferences", render)
electron.send("init")
