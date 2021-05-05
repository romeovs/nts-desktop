import * as React from "react"
import type { Show } from "./lib/show"

import css from "./mixcloud.module.css"

type Props = {
	show: Show | null
	playing: boolean
	onStop: () => void
	onPlay: () => void
}

type EventGroup = {
	on: (handler: (evt: Event) => void) => void
}

interface PlayerWidget {
	play(): void
	pause(): void
	load(key: string, startPlaying?: boolean): void
	ready: Promise<void>
	events: {
		progress: EventGroup
		buffering: EventGroup
		play: EventGroup
		pause: EventGroup
		ended: EventGroup
		error: EventGroup
	}
}

export function Mixcloud(props: Props) {
	const { show, playing, onStop, onPlay } = props

	const ref = React.useRef<HTMLIFrameElement | null>(null)
	const [widget, setWidget] = React.useState<PlayerWidget | null>(null)

	React.useEffect(
		function () {
			if (!ref.current || !show) {
				return
			}

			// @ts-expect-error
			const w = window.Mixcloud.PlayerWidget(ref.current) as PlayerWidget
			w.ready.then(function () {
				w.events.play.on(onPlay)
				w.events.pause.on(onStop)
				w.events.ended.on(onStop)
				setWidget(w)
			})
		},
		[show],
	)

	React.useEffect(
		function () {
			if (!show) {
				widget?.pause()
				return
			}

			widget?.load(key(show.mixcloud), playing)
		},
		[show, widget],
	)

	React.useEffect(
		function () {
			if (playing && show) {
				widget?.play()
				return
			}

			widget?.pause()
		},
		[playing, widget],
	)

	if (!show) {
		return null
	}

	const feed = encodeURIComponent(key(show.mixcloud))
	return (
		<iframe
			ref={ref}
			src={`http://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${feed}`}
			class={css.frame}
		/>
	)
}

function key(url: string) {
	return url.replace(/^https:\/\/www\.mixcloud\.com/, "")
}
