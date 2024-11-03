import DOM from "react-dom"

import { App } from "./app"

function main() {
	const root = document.getElementById("root")
	DOM.render(<App />, root)
}

main()
