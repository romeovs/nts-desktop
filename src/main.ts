import path from "path"
import { app, Tray, nativeImage, BrowserWindow, globalShortcut } from "electron"
import serve from "electron-serve"
import bplist from "bplist-parser"
import menubar from "./logo-menu.png"

const _keep: Record<string, unknown> = {}
const loadURL = serve({ directory: "client" })

app.on("ready", function () {
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
		loadURL(window).then(() => window.loadURL("app://-"))
	} else {
		window.loadURL("http://localhost:8080")
	}

	window.on("blur", function () {
		if (!window.webContents.isDevToolsOpened()) {
			window.hide()
		}
	})

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

		app.dock.hide() // Needed to ensure window appears on top of fullscreen apps
		const trayPos = tray.getBounds()
		const windowPos = window.getBounds()

		const yScale = process.platform == "darwin" ? 1 : 10
		const x = Math.round(trayPos.x + trayPos.width / 2 - windowPos.width / 2)
		const y = Math.round(trayPos.y + trayPos.height * yScale)

		window.setPosition(x, y + 8, false)
		window.show()
		window.focus()
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

	_keep.window = window
	_keep.tray = tray
	_keep.icon = icon
})
