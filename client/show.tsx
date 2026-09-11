import classnames from "classnames"
import { useCallback } from "react"

import type { ShowInfo } from "~/app/show"

import { Controls, formatDuration } from "./controls"
import { Favourite } from "./favourite"
import { Favourites } from "./favourites"
import { PlayButton } from "./play"
import css from "./show.module.css"
import { Tracklist } from "./tracklist/index"

type Props = {
	show: ShowInfo | null
	onPlay: () => void
	onStop: () => void
	onSeek: (pos: number) => void
	playing: boolean
	duration: number
	position: number
}

export function Show(props: Props) {
	const { show, onPlay, onStop, onSeek, playing, duration, position } = props

	const handleToggle = useCallback(
		function () {
			if (playing) {
				onStop()
			} else {
				onPlay()
			}
		},
		[playing, onPlay, onStop],
	)

	// With nothing loaded, the screen is far more useful as a way into the shows
	// you saved than as a hint to go and find a link in a browser.
	if (!show) {
		return <Favourites />
	}

	const { image, name, location, date, tracklist } = show

	return (
		<div className={css.show} data-show="true">
			<div className={css.top}>
				<img src={image} className={css.image} draggable={false} alt="" />
				<div className={css.controls}>
					<button
						type="button"
						className={classnames(css.header, playing && css.playing)}
						onClick={handleToggle}
					>
						<span className={css.badge}>
							<PlayButton playing={playing} className={css.play} />
						</span>
						<span>
							<span className={css.was}>Was Live</span>
							<span className={css.date}>{formatDate(date)}</span>
						</span>
					</button>
					<Favourite show={show.show} episode={show.episode} inline />
				</div>
				<div className={css.footer}>
					<div className={css.location}>{location}</div>
					<br />
					<span className={css.name}>{name}</span>
				</div>
			</div>

			<Controls
				show={show}
				duration={duration}
				position={position}
				onSeek={onSeek}
			/>
			{tracklist.length === 0 && (
				<div className={css.notracklist}>No tracklist provided</div>
			)}
			<Tracklist
				position={position}
				onSeek={onSeek}
				formatPosition={formatDuration}
				tracklist={tracklist.map(function (track) {
					const start = track.offset ?? track.offset_estimate ?? null
					const duration = track.duration ?? track.duration_estimate ?? null
					const end = start && duration ? start + duration : null

					return {
						title: track.title,
						artist: track.artist,
						start,
						end,
					}
				})}
			/>
		</div>
	)
}

function formatDate(date: Date): string {
	return date
		.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "2-digit",
			year: "2-digit",
		})
		.replace(/\//g, ".")
}
