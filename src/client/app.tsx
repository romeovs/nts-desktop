import * as React from "react"
import classnames from "classnames"

import "./global.css"

import { live } from "./lib/api"
import { usePromise } from "./lib/use-promise"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"

import css from "./app.module.css"

export function App() {
	const { loading, data, error } = usePromise(live)
	const [channel, setChannel] = React.useState(0)
	const [playing, setPlaying] = React.useState(false)

	function toggleChannel() {
		setChannel(idx => (idx + 1) % 2)
	}

	return (
		<>
			<Splash hide={!loading} />
			{data && (
				<div className={classnames(css.channels, channel === 1 && css.channel2)} onClick={toggleChannel}>
					<Channel channel={1} info={data.channel1} />
					<Channel channel={2} info={data.channel2} />
				</div>
			)}
			<Player channel={channel} playing={playing} />
		</>
	)
}
