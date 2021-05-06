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

const indexToChannel: Channel[] = [1, 2, "show"]

export function App() {
	const live = useLiveInfo()
	const show = useShowInfo()

	const [index, setIndex] = React.useState<number>(0)
	const [playing, setPlaying] = React.useState<Channel | null>(null)
	const [isOpen, setIsOpen] = React.useState(false)

	const [duration, setDuration] = React.useState(0)
	const [position, setPosition] = React.useState(0)

	function next() {
		setIndex(idx => (idx + 1) % 3)
	}

	function prev() {
		setIndex(idx => (3 + idx - 1) % 3)
	}

	function onStop() {
		setPlaying(null)
	}

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
	}, [])

	React.useEffect(
		function () {
			function handler(evt: KeyboardEvent) {
				switch (evt.key) {
					case "ArrowLeft":
						evt.preventDefault()
						prev()
						return
					case "ArrowRight":
						evt.preventDefault()
						next()
						return
					case " ":
						evt.preventDefault()
						if (playing) {
							setPlaying(null)
							return
						}
						setPlaying(indexToChannel[index])
						return
				}
			}
			window.addEventListener("keydown", handler)
			return () => window.removeEventListener("keydown", handler)
		},
		[playing, index],
	)

	React.useEffect(
		function () {
			function handleClose() {
				setIsOpen(false)

				if (!playing) {
					return
				}

				// Move the slider to the item that is currently playing
				const idx = channelToIndex[playing]
				setIndex(idx)
			}

			electron.on("close", handleClose)
			return () => electron.removeAllListeners("close")
		},
		[playing],
	)

	React.useEffect(
		function () {
			setPosition(0)
		},
		[show.data?.mixcloud],
	)

	React.useEffect(
		function () {
			if (!live.data) {
				return
			}
			const ends1 = live.data.channel1.now.ends
			const ends2 = live.data.channel2.now.ends

			const first = ends1 < ends2 ? ends1 : ends2
			const left = ends1.getTime() - Date.now()
			const t = setTimeout(live.load, left + 500)
			return () => clearTimeout(t)
		},
		[live.data],
	)

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
					<Show
						show={show.data}
						onPlay={() => setPlaying("show")}
						onStop={onStop}
						onSeek={pos => setPosition(pos)}
						playing={playing === "show"}
						duration={duration}
						position={position}
					/>
				</Slide>
			</Slider>
			<button type="button" onClick={prev} className={css.prev}>
				<Arrow direction="left" />
			</button>
			<button type="button" onClick={next} className={css.next}>
				<Arrow direction="right" />
			</button>
			<Player src={streams[1]} playing={playing === 1} onPlay={() => setPlaying(1)} onStop={onStop} />
			<Player src={streams[2]} playing={playing === 2} onPlay={() => setPlaying(2)} onStop={onStop} />
			<Mixcloud
				key={show.data?.mixcloud}
				show={show.data}
				playing={playing === "show"}
				onPlay={() => setPlaying("show")}
				onStop={onStop}
				onLoad={dur => setDuration(Math.round(dur))}
				onProgress={pos => setPosition(Math.round(pos))}
				position={position}
			/>
		</>
	)
}
