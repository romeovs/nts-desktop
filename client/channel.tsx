import classnames from "classnames"

import type { LiveTrack } from "./lib/firebase"
import type { ChannelInfo } from "./lib/live"

import { Indicator } from "./indicator"
import { PlayButton } from "./play"

import css from "./channel.module.css"

type Props = {
	info?: ChannelInfo
	channel: 1 | 2
	onPlay: () => void
	onStop: () => void
	playing: boolean
	tracks: LiveTrack[]
}

export function Channel(props: Props) {
	const { info, channel, onPlay, onStop, playing } = props

	if (!info) {
		return null
	}

	const now = new Date()
	const show = now > info.now.ends ? info.next : info.now
	const { name, image, starts, ends, location } = show

	function handleClick() {
		if (playing) {
			onStop()
		} else {
			onPlay()
		}
	}

	const tracks = props.tracks.filter((track) => track.stream === channel)
	const hasTracks = tracks.some((track) => track.title)

	return (
		<div className={css.wrapper} data-show="true">
			<div className={classnames(css.channel, playing && css.playing)}>
				<img src={image} className={css.image} draggable={false} />
				<button type="button" className={css.header} onClick={handleClick}>
					<div className={css.ch}>
						{channel}
						<PlayButton playing={playing} className={css.play} />
					</div>
					<div>
						<div className={css.live}>
							Live Now <Indicator />
						</div>
						<div>
							{format(starts)} &ndash; {format(ends)}
						</div>
					</div>
				</button>
				<div className={css.footer}>
					<div className={css.location}>{location}</div>
					<br />
					<span className={css.name}>{name}</span>
				</div>
			</div>
			{hasTracks && (
				<ul className={css.tracklist}>
					{tracks.map(
						(track, index) =>
							track.title && (
								<li
									className={css.track}
									onClick={() =>
										navigator.clipboard.writeText(
											`${track.artists.join(", ")} - ${track.title}`,
										)
									}
									key={track.startTime.getTime()}
								>
									<div className={css.time}>
										{track.startTime.toLocaleTimeString("en-GB").substring(0, 5)}
										{index === 0 && <Indicator />}
									</div>
									<div className={css.info}>
										<div className={css.artists}>{track.artists.join(", ")}</div>
										<div className={css.title}>{track.title}</div>
									</div>
								</li>
							),
					)}
				</ul>
			)}
		</div>
	)
}

function format(date: Date): string {
	return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}
