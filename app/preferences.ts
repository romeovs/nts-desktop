import { promises as fs } from "node:fs"
import path from "node:path"
import { app } from "electron"

export type Preferences = {
	volume: number
}

const defaults = {
	volume: 0.8,
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
	const content = JSON.stringify(preferences)
	await fs.writeFile(filename, content)
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}
