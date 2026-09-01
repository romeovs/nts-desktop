import { createRoot } from "react-dom/client"

import { App } from "~/client/app"
import { init } from "~/client/lib/commands"
import { restore } from "~/client/lib/firebase"
import { PreferencesProvider } from "~/client/lib/preferences"

async function main() {
	const root = document.getElementById("root")
	const { preferences, credentials } = await init()

	restore(credentials)

	if (!root) {
		return
	}

	createRoot(root).render(
		<PreferencesProvider preferences={preferences}>
			<App />
		</PreferencesProvider>,
	)
}

main()
