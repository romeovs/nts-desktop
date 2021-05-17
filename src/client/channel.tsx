import * as React from "react"
import classnames from "classnames"
import type { ChannelInfo } from "./lib/live"

import { PlayButton } from "./play"
import { Tracklist } from "./tracklist"
import css from "./channel.module.css"

type Props = {
	info?: ChannelInfo
	channel: 1 | 2
	onPlay: () => void
	onStop: () => void
	playing: boolean
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

	return (
		<div className={classnames(css.channel, playing && css.playing)}>
			<img src={image} className={css.image} draggable={false} />
			<Tracklist channel={channel} />
			<button type="button" className={css.header} onClick={handleClick}>
				<div className={css.ch}>
					{channel}
					<PlayButton playing={playing} className={css.play} />
				</div>
				<div>
					<div className={css.live}>
						Live Now <span className={css.dot} />
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
	)
}

function format(date: Date): string {
	return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
}
