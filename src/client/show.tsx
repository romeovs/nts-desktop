import * as React from "react"
import css from "./show.module.css"

import type { Show } from "./lib/show"
import { PlayButton } from "./play"

type Props = {
	show: Show | null
	onPlay: () => void
	onStop: () => void
	playing: boolean
}

export function Show(props: Props) {
	const { show, onPlay, onStop, playing } = props

	if (!show) {
		return (
			<div className={css.empty}>
				<div>Drop a link on the menu icon to load an episode</div>
			</div>
		)
	}

	const { image, name, location, date, tracklist } = show

	function handleClick() {
		if (playing) {
			onStop()
		} else {
			onPlay()
		}
	}

	return (
		<div className={css.show}>
			<div className={css.top}>
				<img src={image} className={css.image} draggable={false} />

				<div className={css.header}>
					<PlayButton onClick={handleClick} playing={playing} className={css.play} />
					<div className={css.date}>{format(date)}</div>
				</div>
				<div className={css.footer}>
					<div className={css.location}>{location}</div>
					<br />
					<span className={css.name}>{name}</span>
				</div>
			</div>

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

							return (
								<li key={index} onClick={handleClick}>
									<div className={css.artist}>{artist}</div>
									<div>{title}</div>
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
