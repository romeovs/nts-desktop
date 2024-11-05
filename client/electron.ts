// defined in app/preload.js
interface Electron {
	once(name: string, callback: (evt: Event, ...args: any[]) => void): void
	addListener(
		name: string,
		callback: (evt: Event, ...args: any[]) => void,
	): () => void
	removeAllListeners(name: string): void
	send(name: string, ...args: any[]): void
}

// @ts-expect-error
export const electron = window.electron as Electron
