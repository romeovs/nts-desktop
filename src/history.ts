import path from "path"
import { promises as fs } from "fs"
import { app } from "electron"

export type History = Entry[]
export type Entry = {
	name: string
	url: string
}

const filename = path.join(app.getPath("userData"), "history.json")

export async function read(): Promise<History> {
	try {
		const content = await fs.readFile(filename, "utf-8")
		return JSON.parse(content)
	} catch (err) {
		return []
	}
}

async function write(history: History): Promise<void> {
	await fs.writeFile(filename, JSON.stringify(history))
}

export async function add(entry: Entry) {
	const history = await read()
	history.unshift(entry)
	write(history)
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}
