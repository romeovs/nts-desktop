import classnames from "classnames"

import css from "./show.module.css"

import type { ShowInfo } from "../show"
import { Controls, formatDuration } from "./controls"
import { electron } from "./electron"

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

	if (!show) {
		function handleMyNTSClick() {
			electron.send("my-nts")
		}

		function handleExploreClick() {
			electron.send("explore")
		}

		return (
			<div className={css.empty}>
				<div>
					<svg viewBox="0 0 24 24">
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
					</svg>
					<p>Drop a link on the menu icon to load an episode</p>
					<div className={css.nav}>
						<button type="button" onClick={handleMyNTSClick}>
							My NTS
						</button>
						<button type="button" onClick={handleExploreClick}>
							Explore
						</button>
					</div>
				</div>
			</div>
		)
	}

	const { image, name, location, date, tracklist } = show

	return (
		<div className={css.show} data-show="true">
			<div className={css.top}>
				<img src={image} className={css.image} draggable={false} />
				<div className={css.header}>
					<div className={css.date}>{format(date)}</div>
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
				playing={playing}
				onPlay={onPlay}
				onStop={onStop}
				onSeek={onSeek}
			/>
			<div className={css.tracklist}>
				{tracklist.length === 0 && <div className={css.notracklist}>No tracklist provided</div>}
				{tracklist.length > 0 && (
					<ul>
						{tracklist.map(function (track, index) {
							const { title, artist } = track
							function handleClick() {
								//
								navigator.clipboard.writeText(`${artist} - ${title}`)
							}

							const from = track.offset ?? track.offset_estimate ?? null
							const duration = track.duration ?? track.duration_estimate ?? null
							const to = from && duration ? from + duration : null

							const isActive = from && to && from <= position && position <= to

							function goToTrack() {
								if (from === null) {
									return
								}

								onSeek(from)
							}

							return (
								<li key={index} onClick={handleClick} className={classnames(isActive && css.active)}>
									<div className={css.head}>
										<div className={css.artist}>{artist}</div>
										<div>{title}</div>
									</div>
									<div className={css.time}>
										{isActive && <span className={css.indicator}>●&nbsp;</span>}
										{from !== null && (
											<span className={css.from} onClick={goToTrack}>
												{formatDuration(from)}
											</span>
										)}
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</div>
		</div>
	)
}

function format(date: Date): string {
	return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".")
}
