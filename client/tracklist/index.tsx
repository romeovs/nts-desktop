import classnames from "classnames"
import { type MouseEvent, useCallback } from "react"
import { notify } from "~/client/notifications"

import { Indicator } from "~/client/indicator"

import css from "./styles.module.css"

type Track = {
	title: string
	artist: string
	start?: number | null
	end?: number | null
}

type TracklistProps = {
	tracklist: Track[]
	position: number
	formatPosition: (position: number) => string
	onSeek?: (position: number) => void
}

export function Tracklist(props: TracklistProps) {
	const { tracklist, onSeek, position, formatPosition } = props
	if (tracklist.length === 0) {
		return null
	}

	return (
		<ul className={css.tracklist}>
			{tracklist.map((track, index) => (
				<TrackItem
					key={`${track.start}_${index}`}
					track={track}
					index={index}
					position={position}
					onSeek={onSeek}
					formatPosition={formatPosition}
				/>
			))}
		</ul>
	)
}

type TrackProps = {
	track: Track
	index: number
	position: number
	onSeek?: (position: number) => void
	formatPosition: (position: number) => string
}

function TrackItem(props: TrackProps) {
	const { track, index, position, formatPosition, onSeek } = props
	const { title, artist } = track

	const from = track.start
	const to = track.end ?? null

	const isActive =
		from && (!to || Boolean(from && to && from <= position && position < to))

	const handleClick = useCallback(
		function () {
			navigator.clipboard.writeText(`${artist} - ${title}`)
			notify({ message: "copied to clipboard!", ttl: 2000 })
		},
		[artist, title],
	)

	const handleSeek = useCallback(
		function (evt: MouseEvent<HTMLDivElement>) {
			evt.stopPropagation()
			if (typeof from !== "number" || !onSeek) {
				return
			}
			onSeek(from)
		},
		[onSeek, from],
	)

	return (
		<li
			key={index}
			onClick={handleClick}
			className={classnames(
				css.track,
				isActive && css.active,
				onSeek && css.seekable,
			)}
		>
			<div className={css.time} onClick={handleSeek}>
				{typeof from === "number" && (
					<span className={css.from}>{formatPosition(from)}</span>
				)}
				{typeof from !== "number" && (
					<span className={classnames(css.from, css.unknown)}>--:--</span>
				)}

				{isActive && <Indicator className={css.indicator} />}
			</div>

			<div className={css.info}>
				<div className={css.artist}>{artist}</div>
				<div className={css.title}>{title}</div>
			</div>
		</li>
	)
}
