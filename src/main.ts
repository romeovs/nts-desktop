import { app } from "electron"

import { NTSApplication } from "./application"

let application = null

async function main() {
	await app.whenReady()

	application = new NTSApplication()
	await application.init()
}

main()
