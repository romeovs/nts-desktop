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
	dialog,
} from "electron"
import bplist from "bplist-parser"
import serve from "electron-serve"
import menubar from "./logo-menu.png"
import * as history from "./history"
import { show } from "./show"

const loadURL = serve({ directory: "client" })

export class NTSApplication {
	window: BrowserWindow
	tray: Tray
	evts: EventEmitter

	constructor() {
		this.window = makeWindow()
		this.tray = makeTray()
		this.evts = new EventEmitter()
	}

	async init() {
		this.tray.on("click", () => this.toggle())
		this.tray.on("right-click", () => this.openMenu())
		this.tray.on("drop-text", (evt: Event, url: string) => this.openURL(url))
		this.tray.on("drop-files", (evt: Event, files: string[]) => this.openFile(files[0]))

		this.evts.on("error", (message: string) => this.showNotification(message))

		ipcMain.on("close", () => this.close())
		ipcMain.on("tracklist", (evt: Event, channel: number | string) => this.openTracklist(channel))
		ipcMain.on("my-nts", () => this.openMyNTS())
		ipcMain.on("explore", () => this.openExplore())

		app.on("open-file", (evt: Event, filename: string) => this.openFile(filename))
		app.on("will-quit", () => globalShortcut.unregisterAll())
		app.on("activate", () => this.open())

		globalShortcut.register("Control+N", () => this.toggle())

		setTimeout(() => app.dock.hide(), 500)
		await this.loadClient()
	}

	async loadClient() {
		const prod = __dirname.endsWith(".asar")
		if (prod) {
			await loadURL(this.window)
			this.window.loadURL("app://-")
		} else {
			this.window.loadURL("http://localhost:8080")
		}
	}

	isOpen() {
		return this.window.isVisible()
	}

	close() {
		this.window.webContents.send("close")
		setTimeout(() => this.window.hide(), 10)
	}

	handleBlur() {
		if (!this.window.webContents.isDevToolsOpened()) {
			this.close()
		}
	}

	open() {
		this.window.webContents.send("open")

		const trayPos = this.tray.getBounds()
		const windowPos = this.window.getBounds()

		const yScale = process.platform == "darwin" ? 1 : 10
		const x = Math.round(trayPos.x + trayPos.width / 2 - windowPos.width / 2)
		const y = Math.round(trayPos.y + trayPos.height * yScale)

		this.window.setPosition(x, y + 8, false)
		this.window.show()
		this.window.focus()

		setTimeout(() => this.window.once("blur", () => this.handleBlur()), 300)
	}

	toggle() {
		if (this.isOpen()) {
			this.close()
		} else {
			this.open()
		}
	}

	reload() {
		this.window.reload()
	}

	async openMenu() {
		this.close()
		const menu = await makeMenu(this)
		this.tray.popUpContextMenu(menu)
	}

	async openFile(filename: string) {
		if (!filename.endsWith(".webloc")) {
			this.evts.emit("error", "NTS Desktop can only open .webloc files")
			return
		}

		const content = await bplist.parseFile(filename)
		const url = content[0].URL
		app.addRecentDocument(filename)
		this.openURL(url)
	}

	async openURL(url: string) {
		if (!url.startsWith("https://www.nts.live/shows/")) {
			this.evts.emit("error", "Please use a valid NTS show URL")
			return
		}

		const data = await show(url)
		history.add({ name: data.name, url })
		this.window.webContents.send("open-show", data)
	}

	async browse() {
		const { filePaths, canceled } = await dialog.showOpenDialog({
			message: "Select a link to an archive show",
			properties: ["openFile"],
			filters: [{ name: "links", extensions: ["webloc"] }],
		})

		if (canceled) {
			return
		}

		this.openFile(filePaths[0])
	}

	showNotification(message: string) {
		const notification = new Notification({
			body: message,
			silent: true,
		})
		notification.show()
	}

	openAbout() {
		shell.openExternal("https://github.com/romeovs/nts-desktop")
	}

	openTracklist(channel: number | string) {
		shell.openExternal(`https://www.nts.live/live-tracklist/${channel}`)
	}

	openMyNTS() {
		shell.openExternal("https://www.nts.live/my-nts/favourites/shows")
	}

	openExplore() {
		shell.openExternal("https://www.nts.live/explore")
	}

	openSchedule() {
		shell.openExternal("https://www.nts.live/schedule")
	}
}

function makeWindow(): BrowserWindow {
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

	return window
}

function makeTray(): Tray {
	const filename = path.resolve(__dirname, menubar)
	const icon = nativeImage.createFromPath(filename).resize({ width: 16, height: 16 })
	icon.setTemplateImage(true)
	return new Tray(icon)
}

async function makeMenu(application: NTSApplication): Promise<Menu> {
	const h = await history.read()

	return Menu.buildFromTemplate([
		{
			label: "About NTS Desktop",
			click: () => application.openAbout(),
		},
		{
			label: "Schedule",
			click: () => application.openSchedule(),
		},
		{ type: "separator" },
		{
			label: "Show NTS Desktop",
			accelerator: "Control+N",
			acceleratorWorksWhenHidden: true,
			click: () => application.open(),
		},
		{
			label: "Load Archive Show...",
			click: () => application.browse(),
		},
		{
			label: "Recently Listened Shows",
			submenu: [
				...h.map(entry => ({
					label: entry.name,
					click: () => void application.openURL(entry.url),
				})),
				{
					type: "separator",
				},
				{
					label: "Clear",
					enabled: h.length > 0,
					click: () => history.clear(),
				},
			],
		},
		{ type: "separator" },
		{
			label: "Reload NTS Desktop",
			click: () => application.reload(),
		},
		{ label: "Quit NTS Desktop", role: "quit" },
	])
}
