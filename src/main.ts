import path from "path"
import { app, Tray, nativeImage, BrowserWindow, globalShortcut } from "electron"
import log from "electron-log"
import serve from "electron-serve"
import bplist from "bplist-parser"
import menubar from "./logo-menu.png"

const loadURL = serve({ directory: "client" })

let global = {}

async function main() {
	await app.whenReady()

	setTimeout(() => app.dock.hide(), 500)

	// Initialise window
	const window = new BrowserWindow({
		width: 320,
		height: 240,
		show: false,
		frame: false,
		resizable: false,
		alwaysOnTop: true,
		webPreferences: {
			webSecurity: true,
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			preload: path.resolve(__dirname, "preload.js"),
		},
	})

	window.setAlwaysOnTop(true, "floating")
	window.setVisibleOnAllWorkspaces(true)
	window.fullScreenable = false

	const prod = __dirname.endsWith(".asar")
	if (prod) {
		await loadURL(window)
		window.loadURL("app://-")
	} else {
		window.loadURL("http://localhost:8080")
	}

	// Initialise menubar icon
	const icon = nativeImage.createFromPath(path.resolve(__dirname, menubar)).resize({ width: 16, height: 16 })
	const tray = new Tray(icon)
	tray.on("click", function () {
		if (window.isVisible()) {
			window.webContents.send("close")

			setTimeout(() => window.hide(), 10)
			return
		}

		window.webContents.send("open")

		const trayPos = tray.getBounds()
		const windowPos = window.getBounds()

		const yScale = process.platform == "darwin" ? 1 : 10
		const x = Math.round(trayPos.x + trayPos.width / 2 - windowPos.width / 2)
		const y = Math.round(trayPos.y + trayPos.height * yScale)

		window.setPosition(x, y + 8, false)
		window.show()
		window.focus()

		setTimeout(function () {
			window.once("blur", function () {
				if (!window.webContents.isDevToolsOpened()) {
					window.hide()
				}
			})
		}, 300)
	})

	tray.on("drop-text", function (evt: Event, text: string) {
		window.webContents.send("drop", text)
	})

	tray.on("drop-files", async function (evt: Event, files: string[]) {
		const [file] = files
		if (file.endsWith(".webloc")) {
			const content = await bplist.parseFile(file)
			const url = content[0].URL
			window.webContents.send("drop", url)
		}
	})

	global = { window, tray, icon }
}

main()
