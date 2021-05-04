import * as React from "react"
import classnames from "classnames"

import "./global.css"

import { electron } from "./electron"
import { live as getLive, Info } from "./lib/api"
import { show as getShow, Show as ShowT } from "./lib/show"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"
import { Mixcloud } from "./mixcloud"
import { Show } from "./show"

import css from "./app.module.css"

type State<T> = {
	loading: boolean
	data: T | null
	error: Error | null
}

export function App() {
	const [live, setLive] = React.useState<State<Info>>({ loading: true, error: null, data: null })
	const [show, setShow] = React.useState<State<ShowT>>({ loading: false, error: null, data: null })

	const [channel, setChannel] = React.useState(0)
	const [playing, setPlaying] = React.useState(false)

	React.useEffect(function () {
		async function load() {
			setLive({ loading: true, data: null, error: null })
			try {
				const data = await getLive()
				setLive({ loading: false, data, error: null })
			} catch (error) {
				setLive({ loading: false, data: null, error })
			}
		}

		load()

		electron.on("open", load)
		electron.on("drop", async function (evt: Event, url: string) {
			setShow({ loading: true, data: null, error: null })
			try {
				const data = await getShow(url)
				setShow({ loading: false, data, error: null })
				setChannel(2)
				setPlaying(true)
			} catch (error) {
				setShow({ loading: false, data: null, error })
			}
		})
	}, [])

	function toggleChannel() {
		setChannel(idx => (idx + 1) % 3)
	}

	const classname = classnames(css.channels, {
		[css.channel2]: channel === 1,
		[css.show]: channel === 2,
	})

	return (
		<>
			<Splash hide={!live.loading} />
			<div className={classname} onClick={toggleChannel}>
				{live.data && <Channel channel={1} info={live.data.channel1} />}
				{live.data && <Channel channel={2} info={live.data.channel2} />}
				<Show show={show.data} />
			</div>
			<Player channel={channel} playing={playing} />
			<Mixcloud show={show.data} playing={playing && channel === 2} />
		</>
	)
}
