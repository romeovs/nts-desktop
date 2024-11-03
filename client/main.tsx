import DOM from "react-dom"

import { App } from "~/client/app"

function main() {
	const root = document.getElementById("root")
	DOM.render(<App />, root)
}

main()
