interface Electron {
	on(name: string, callback: (evt: Event, ...args: any[]) => void): void
	removeListener(name: string, callback: (evt: Event, ...args: any[]) => void): void
	removeAllListeners(name: string, callback: (evt: Event, ...args: any[]) => void): void
}

// @ts-expect-error
export const electron = window.electron as Electron
