import path from "path"
import { app, Tray, nativeImage, BrowserWindow, globalShortcut } from "electron"
import menubar from "./logo-menu.png"

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

	if (process.env.NODE_ENV === "production") {
		window.loadFile("./dist/index.html")
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
			window.hide()
			return
		}

		app.dock.hide() // Needed to ensure window appears on top of fullscreen apps
		const trayPos = tray.getBounds()
		const windowPos = window.getBounds()

		const yScale = process.platform == "darwin" ? 1 : 10
		const x = Math.round(trayPos.x + trayPos.width / 2 - windowPos.width / 2)
		const y = Math.round(trayPos.y + trayPos.height * yScale)

		window.setPosition(x, y + 16, false)
		window.show()
		window.focus()
	})

	tray.on("drop-text", function (evt: Event, text: string) {
		window.webContents.send("drop", text)
	})
})
