import { app } from "electron"

import { NTSApplication } from "./application"

let application = null

async function main() {
	const production = __dirname.endsWith(".asar")
	console.log(`Starting NTS Desktop... (production=${production})`)

	await app.whenReady()

	application = new NTSApplication(production)
	await application.init()
}

main()
