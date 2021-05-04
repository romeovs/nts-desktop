import * as React from "react"
import classnames from "classnames"

import "./global.css"

import { live } from "./lib/api"
import { usePromise } from "./lib/use-promise"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"
import { Show } from "./show"

import css from "./app.module.css"

export function App() {
	const { loading, data, error } = usePromise(live)
	const [channel, setChannel] = React.useState(0)
	const [playing, setPlaying] = React.useState(false)

	function toggleChannel() {
		setChannel(idx => (idx + 1) % 3)
	}

	const classname = classnames(css.channels, {
		[css.channel1]: channel === 0,
		[css.channel2]: channel === 1,
		[css.show]: channel === 2,
	})

	return (
		<>
			<Splash hide={!loading} />
			<div className={classname} onClick={toggleChannel}>
				{data && <Channel channel={1} info={data.channel1} />}
				{data && <Channel channel={2} info={data.channel2} />}
				<Show />
			</div>
			<Player channel={channel} playing={playing} />
		</>
	)
}
