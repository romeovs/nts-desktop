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

export function Soundcloud(props: Props) {
	const { show, playing, onStop, onPlay, onProgress, onLoad, position, volume = 1 } = props

	const ref = React.useRef<HTMLIFrameElement | null>(null)
	const [widget, setWidget] = React.useState<SC.Widget | null>(null)

	React.useEffect(
		function () {
			if (!ref.current || !show) {
				return
			}

			// @ts-expect-error
			const Events = SC.Widget.Events

			// @ts-expect-error
			const w = SC.Widget(ref.current)
			w.bind(Events.PLAY, onPlay)
			w.bind(Events.PAUSE, onStop)
			w.bind(Events.FINISH, onStop)
			w.bind(Events.PLAY_PROGRESS, function (evt: { currentPosition: number }) {
				onProgress(evt.currentPosition / 1000)
			})
			w.bind(Events.READY, function () {
				w.getDuration(function (duration: number) {
					onLoad(duration / 1000)
				})
				setWidget(w)
			})
			w.setVolume(volume * 100)
		},
		[show],
	)

	React.useEffect(
		function () {
			if (!widget) {
				return
			}

			widget.getPosition(function (curr: number) {
				if (Math.abs(position - curr / 1000) < 1) {
					return
				}
				widget.seekTo(position * 1000)
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
			widget?.setVolume(volume * 100)
		},
		[volume, widget],
	)

	if (!show) {
		return null
	}

	const feed = encodeURIComponent(show.source.url)
	return (
		<iframe ref={ref} src={`https://w.soundcloud.com/player/?url=${feed}`} allow="autoplay" className={css.frame} />
	)
}
