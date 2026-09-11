import { type MouseEvent, useRef } from "react"
import type { ShowInfo } from "~/app/show"
import css from "./controls.module.css"

type Props = {
	duration: number
	position: number
	show: ShowInfo
	onSeek: (pos: number) => void
}

export function Controls(props: Props) {
	const { duration, position, onSeek } = props
	const width = duration === 0 ? 0 : (100 * position) / duration
	const ref = useRef<HTMLDivElement | null>(null)

	function handleClick(evt: MouseEvent<HTMLDivElement>) {
		if (!ref.current) {
			return
		}

		const { left, width } = ref.current.getBoundingClientRect()
		const x = evt.clientX - left
		const percentage = x / width
		const pos = Math.round(duration * percentage)

		onSeek(pos)
	}

	const isEmpty = duration === 0 && position === 0

	return (
		<div className={css.controls}>
			<div className={css.bar} onClick={handleClick} ref={ref}>
				<div className={css.pos} style={{ width: `${width}%` }} />
			</div>
			{isEmpty && <div className={css.time}>--:--/--:--</div>}
			{!isEmpty && (
				<div className={css.time}>
					{formatDuration(position)}/{formatDuration(duration)}
				</div>
			)}
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
