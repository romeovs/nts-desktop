import classnames from "classnames"

import type { LiveTrack } from "~/app/live-tracks"
import type { ChannelInfo } from "./lib/live"

import { Indicator } from "./indicator"
import { PlayButton } from "./play"
import { Tracklist } from "./tracklist/index"

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
							{formatTime(starts)} &ndash; {formatTime(ends)}
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
				<Tracklist
					position={Date.now()}
					formatPosition={formatTime}
					tracklist={tracks
						.map(function (track, index, arr) {
							const prev = arr[index - 1]
							return {
								title: track.title,
								artist: track.artists.join(", "),
								start: track.startTime.getTime(),
								end: prev ? prev.startTime.getTime() + 100 : null,
							}
						})
						.filter((track) => track.title !== "")}
				/>
			)}
		</div>
	)
}

function formatTime(date: Date | number): string {
	return new Date(date).toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	})
}
