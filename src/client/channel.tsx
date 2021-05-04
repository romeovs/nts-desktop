import * as React from "react"
import type { ChannelInfo } from "./lib/api"

import css from "./channel.module.css"

type Props = {
	info?: ChannelInfo
	channel: number
}

export function Channel(props: Props) {
	const { info, channel } = props

	if (!info) {
		return null
	}

	const { name, image, starts, ends, location } = info

	return (
		<div className={css.channel}>
			<img src={image} className={css.image} draggable={false} />
			<div className={css.header}>
				<div className={css.ch}>{channel}</div>
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
