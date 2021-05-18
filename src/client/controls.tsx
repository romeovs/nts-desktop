import * as React from "react"
import css from "./controls.module.css"

import type { ShowInfo } from "../show"

import { PlayButton } from "./play"
import { Mixcloud } from "./mixcloud"

type Props = {
	duration: number
	position: number
	show: ShowInfo
	playing: boolean
	onPlay: () => void
	onStop: () => void
	onSeek: (pos: number) => void
}

export function Controls(props: Props) {
	const { show, duration, position, onPlay, onStop, playing, onSeek } = props
	const [select, setSelect] = React.useState(0)
	const width = (100 * position) / duration
	const ref = React.useRef<HTMLDivElement | null>(null)

	function handlePlayClick() {
		if (playing) {
			onStop()
		} else {
			onPlay()
		}
	}

	function handleClick(evt: React.MouseEvent<HTMLDivElement>) {
		if (!ref.current) {
			return
		}

		const { left, width } = ref.current.getBoundingClientRect()
		const x = evt.clientX - left
		const percentage = x / width
		const pos = Math.round(duration * percentage)

		onSeek(pos)
	}

	return (
		<div className={css.controls}>
			<button onClick={handlePlayClick} type="button" className={css.play}>
				<PlayButton playing={playing} />
			</button>
			<div className={css.bar} onClick={handleClick} ref={ref}>
				<div className={css.pos} style={{ width: `${width}%` }} />
			</div>
			<div className={css.time}>
				{formatDuration(position)}/{formatDuration(duration)}
			</div>
		</div>
	)
}

export function formatDuration(seconds: number): string {
	const sec = seconds % 60
	const min = ((seconds - sec) / 60) % 60
	const hours = (seconds - sec - 60 * min) / 3600

	const r = []
	if (hours !== 0) {
		r.push(hours)
	}

	r.push(pad(min))
	r.push(pad(sec))

	return r.join(":")
}

function pad(x: number): string {
	if (x >= 10) {
		return x.toString()
	}

	return `0${x}`
}
