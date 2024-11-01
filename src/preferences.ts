import { promises as fs } from "fs"
import path from "path"
import { safeStorage } from "electron"
import { app } from "electron"

export type Preferences = {
	volume: number
	email: string | null
	password: string | null
}

const defaults = {
	volume: 0.8,
	email: null,
	password: null,
}

const filename = path.join(app.getPath("userData"), "preferences.json")

export async function read(): Promise<Preferences> {
	try {
		const buf = await fs.readFile(filename)
		const content = safeStorage.decryptString(buf)
		return JSON.parse(content)
	} catch (err) {
		return defaults
	}
}

export async function write(preferences: Preferences): Promise<void> {
	const content = JSON.stringify(preferences)
	const buf = safeStorage.encryptString(content)
	await fs.writeFile(filename, buf)
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}
