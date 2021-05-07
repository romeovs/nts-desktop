import * as React from "react"
import classnames from "classnames"
import type { ChannelInfo } from "./lib/live"

import { PlayButton } from "./play"
import css from "./channel.module.css"

type Props = {
	info?: ChannelInfo
	channel: number
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
			<div className={css.header}>
				<div className={css.ch}>
					{channel}
					<PlayButton playing={playing} className={css.play} onClick={handleClick} />
				</div>
				<div>
					<div className={css.live}>
						Live Now <span className={css.dot} />
					</div>
					<div>
						{format(starts)} &mdash; {format(ends)}
					</div>
				</div>
			</div>
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
