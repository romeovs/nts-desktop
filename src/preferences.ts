import path from "path"
import { promises as fs } from "fs"
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
		const content = await fs.readFile(filename, "utf-8")
		return JSON.parse(content)
	} catch (err) {
		return defaults
	}
}

export async function write(preferences: Preferences): Promise<void> {
	await fs.writeFile(filename, JSON.stringify(preferences))
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}
