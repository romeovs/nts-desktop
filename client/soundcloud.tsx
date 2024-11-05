import { useEffect, useRef, useState } from "react"
import type { ShowInfo } from "~/app/show"

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

type SCWidget = {
	getPosition(callback: (pos: number) => void): void
	getDuration(callback: (dur: number) => void): void
	seekTo(pos: number): void
	play(): void
	pause(): void
	setVolume(volume: number): void
}

export function Soundcloud(props: Props) {
	const {
		show,
		playing,
		onStop,
		onPlay,
		onProgress,
		onLoad,
		position,
		volume = 1,
	} = props

	const ref = useRef<HTMLIFrameElement | null>(null)
	const seekingTo = useRef<number | null>(null)
	const [widget, setWidget] = useState<SCWidget | null>(null)

	useEffect(
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
				const position = evt.currentPosition / 1000
				const rounded = Math.round(position)

				if (seekingTo.current === null) {
					onProgress(rounded)
					return
				}

				if (seekingTo.current === rounded) {
					seekingTo.current = null
					onProgress(rounded)
				}
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

	useEffect(
		function () {
			if (!widget) {
				return
			}

			widget.getPosition(function (curr: number) {
				if (Math.abs(position - curr / 1000) < 1) {
					return
				}
				seekingTo.current = position
				widget.seekTo(position * 1000)
				onProgress(position)
			})
		},
		[position, widget, onProgress],
	)

	useEffect(
		function () {
			if (playing && show) {
				widget?.play()
				return
			}

			widget?.pause()
		},
		[playing, widget, show],
	)

	useEffect(
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
		<iframe
			ref={ref}
			src={`https://w.soundcloud.com/player/?url=${feed}`}
			allow="autoplay"
			className={css.frame}
		/>
	)
}
