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
import { Slider, Slide } from "./slider"

import css from "./app.module.css"

type State<T> = {
	loading: boolean
	data: T | null
	error: Error | null
}

type Channel = 1 | 2 | "show"

export function App() {
	const [live, setLive] = React.useState<State<Info>>({ loading: true, error: null, data: null })
	const [show, setShow] = React.useState<State<ShowT>>({ loading: false, error: null, data: null })

	const channel = 1
	const [index, setIndex] = React.useState<number>(1)
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
				setIndex(3)
				setPlaying(true)
			} catch (error) {
				setShow({ loading: false, data: null, error })
			}
		})
	}, [])

	function next() {
		setIndex(idx => (idx + 1) % 3)
	}

	return (
		<>
			<Splash hide={!live.loading && !show.loading} />
			<Slider index={index}>
				<Slide>
					<Channel channel={1} info={live.data?.channel1} />
				</Slide>
				<Slide>
					<Channel channel={2} info={live.data?.channel2} />
				</Slide>
				<Slide>
					<Show show={show.data} />
				</Slide>
			</Slider>
			<Player channel={channel} playing={playing} />
			<Mixcloud show={show.data} playing={playing && channel === 2} />
		</>
	)
}
