import { promises as fs } from "node:fs"
import path from "node:path"
import { app, safeStorage } from "electron"

export type Credentials = {
	email: string
	password: string
}

const filename = path.join(app.getPath("userData"), "credentials.json")

export async function read(): Promise<Credentials | null> {
	try {
		const buf = await fs.readFile(filename)
		const content = safeStorage.decryptString(buf)
		const creds = JSON.parse(content)
		if (creds.email && creds.password) {
			return creds
		}
		return null
	} catch (err) {
		return null
	}
}

export async function write(credentials: Credentials): Promise<void> {
	const content = JSON.stringify(credentials)
	const buf = safeStorage.encryptString(content)
	await fs.writeFile(filename, buf)
}

export async function clear(): Promise<void> {
	await fs.unlink(filename)
}
