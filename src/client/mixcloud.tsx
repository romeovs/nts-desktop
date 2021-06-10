import * as React from "react"
import type { ShowInfo } from "../show"

import css from "./mixcloud.module.css"

type Props = {
	show: ShowInfo | null
	playing: boolean
	onStop: () => void
	onPlay: () => void
	onProgress: (pos: number) => void
	onLoad: (dur: number) => void
	position: number
	volume?: number
}

export function Mixcloud(props: Props) {
	const { show, playing, onStop, onPlay, onProgress, onLoad, position, volume = 1 } = props

	const ref = React.useRef<HTMLIFrameElement | null>(null)
	const [widget, setWidget] = React.useState<Mixcloud.PlayerWidget | null>(null)

	React.useEffect(
		function () {
			if (!ref.current || !show) {
				return
			}

			// @ts-expect-error
			const w = window.Mixcloud.PlayerWidget(ref.current) as Mixcloud.PlayerWidget
			w.ready
				.then(function () {
					w.events.play.on(onPlay)
					w.events.pause.on(onStop)
					w.events.ended.on(onStop)
					w.events.progress.on(onProgress)
					w.getDuration().then(duration => onLoad(duration))
					setWidget(w)
				})
				.catch(err => console.error(err))
		},
		[show],
	)

	React.useEffect(
		function () {
			if (!widget) {
				return
			}

			widget.getPosition().then(function (curr) {
				if (Math.abs(position - curr) < 1) {
					return
				}
				widget.seek(position)
			})
		},
		[position, widget],
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

	React.useEffect(
		function () {
			widget?.setVolume(volume)
		},
		[volume, widget],
	)

	if (!show) {
		return null
	}

	const feed = encodeURIComponent(key(show.mixcloud))
	return (
		<iframe
			ref={ref}
			src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${feed}`}
			className={css.frame}
		/>
	)
}

function key(url: string) {
	return url.replace(/^https:\/\/www\.mixcloud\.com/, "")
}
