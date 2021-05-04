import * as React from "react"
import classnames from "classnames"

import "./global.css"

import { electron } from "./electron"
import { useLiveInfo } from "./lib/live"
import { useShowInfo } from "./lib/show"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"
import { Mixcloud } from "./mixcloud"
import { Show } from "./show"
import { Slider, Slide } from "./slider"
import { Arrow } from "./arrow"

import css from "./app.module.css"

const streams = {
	1: "https://stream-relay-geo.ntslive.net/stream?client=NTSWebApp",
	2: "https://stream-relay-geo.ntslive.net/stream2?client=NTSWebApp",
}

type Channel = 1 | 2 | "show"

const channelToIndex: Record<Channel, number> = {
	1: 0,
	2: 1,
	show: 2,
}

export function App() {
	const live = useLiveInfo()
	const show = useShowInfo()

	const [index, setIndex] = React.useState<number>(0)
	const [playing, setPlaying] = React.useState<Channel | null>(null)
	const [isOpen, setIsOpen] = React.useState(false)

	React.useEffect(function () {
		live.load()
		electron.on("drop", async function (_: Event, url: string) {
			await show.load(url)
			setPlaying("show")
			setIndex(channelToIndex.show)
		})
		electron.on("open", function () {
			live.load()
			setIsOpen(true)
		})
		electron.on("close", function () {
			setIsOpen(false)

			if (!playing) {
				return
			}

			// Move the slider to the item that is currently playing
			setTimeout(function () {
				const idx = channelToIndex[playing]
				setIndex(idx)
			}, 100)
		})
	}, [])

	function next() {
		setIndex(idx => (idx + 1) % 3)
	}

	function prev() {
		setIndex(idx => (3 + idx - 1) % 3)
	}

	function onStop() {
		setPlaying(null)
	}

	return (
		<>
			<Splash hide={!live.loading && !show.loading} />
			<Slider index={index} animate={isOpen}>
				<Slide>
					<Channel
						info={live.data?.channel1}
						channel={1}
						playing={playing === 1}
						onPlay={() => setPlaying(1)}
						onStop={onStop}
					/>
				</Slide>
				<Slide>
					<Channel
						info={live.data?.channel2}
						channel={2}
						playing={playing === 2}
						onPlay={() => setPlaying(2)}
						onStop={onStop}
					/>
				</Slide>
				<Slide>
					<Show show={show.data} />
				</Slide>
			</Slider>
			<button type="button" onClick={prev} className={css.prev}>
				<Arrow direction="left" />
			</button>
			<button type="button" onClick={next} className={css.next}>
				<Arrow direction="right" />
			</button>
			<Player src={streams[1]} playing={playing === 1} />
			<Player src={streams[2]} playing={playing === 2} />
			<Mixcloud show={show.data} playing={playing === "show"} />
		</>
	)
}
