namespace Mixcloud {
	type Event<Handler extends Function = () => void> = {
		on: (handler: Handler) => void
		off: (handler: Handler) => void
	}

	class PlayerWidget {
		play(): void
		pause(): void
		togglePlay(): void
		load(key: string, startPlaying?: boolean): void
		seek(pos: number): Promise<boolean>
		ready: Promise<void>
		getDuration(): Promise<number>
		getPosition(): Promise<number>
		getIsPaused(): Promise<boolean>
		setVolume(value: number): void
		events: {
			progress: Event<(pos: number) => void>
			buffering: Event
			play: Event
			pause: Event
			ended: Event
			error: Event
		}
	}
}

declare global {
	interface Window {
		Mixcloud: Mixcloud
	}
}
