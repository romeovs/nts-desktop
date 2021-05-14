import path from "path"
import EventEmitter from "events"
import {
	app,
	shell,
	ipcMain,
	Tray,
	nativeImage,
	BrowserWindow,
	globalShortcut,
	Notification,
	Menu,
	GlobalShortcut,
} from "electron"
import log from "electron-log"
import serve from "electron-serve"
import bplist from "bplist-parser"
import menubar from "./logo-menu.png"

const loadURL = serve({ directory: "client" })

let global = {}

async function main() {
	const evts = new EventEmitter()
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

	function close() {
		window.webContents.send("close")
		setTimeout(() => window.hide(), 10)
	}

	function open() {
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
	}

	function toggle() {
		if (window.isVisible()) {
			close()
			return
		}

		open()
	}

	// Initialise menubar icon
	const icon = nativeImage.createFromPath(path.resolve(__dirname, menubar)).resize({ width: 16, height: 16 })
	const tray = new Tray(icon)
	const menu = Menu.buildFromTemplate([
		{
			label: "Open",
			accelerator: "Control+N",
			acceleratorWorksWhenHidden: true,
			click() {
				toggle()
			},
		},
		{
			label: "About NTS Desktop",
			click() {
				shell.openExternal("https://github.com/romeovs/nts-desktop")
			},
		},
		{
			label: "Reload NTS Desktop",
			click() {
				window.reload()
			},
		},
		{ type: "separator" },
		{ label: "Quit NTS Desktop", role: "quit" },
	])

	tray.on("click", function () {
		toggle()
	})

	tray.on("right-click", function () {
		tray.popUpContextMenu(menu)
	})

	tray.on("drop-text", function (evt: Event, text: string) {
		if (!text.startsWith("https://www.nts.live/shows/")) {
			evts.emit("error", "Please use a valid NTS show URL")
			return
		}
		window.webContents.send("drop", text)
	})

	tray.on("drop-files", async function (evt: Event, files: string[]) {
		const [file] = files
		if (file.endsWith(".webloc")) {
			const content = await bplist.parseFile(file)
			const url = content[0].URL
			if (!url.startsWith("https://www.nts.live/shows/")) {
				evts.emit("error", "Please use a valid NTS show URL")
				return
			}
			window.webContents.send("drop", url)
		}
	})

	evts.on("error", function (msg: string) {
		const notification = new Notification({
			body: msg,
			silent: true,
		})
		notification.show()
	})

	ipcMain.on("close", function () {
		close()
	})

	ipcMain.on("tracklist", function (evt: Event, channel: number | string) {
		shell.openExternal(`https://www.nts.live/live-tracklist/${channel}`)
	})

	ipcMain.on("my-nts", function (evt: Event, channel: number | string) {
		shell.openExternal("https://www.nts.live/my-nts/favourites/shows")
	})

	ipcMain.on("explore", function (evt: Event, channel: number | string) {
		shell.openExternal("https://www.nts.live/explore")
	})

	globalShortcut.register("Control+N", function () {
		toggle()
	})

	app.on("will-quit", function () {
		globalShortcut.unregisterAll()
	})

	global = { window, tray, icon, menu }
}

main()
