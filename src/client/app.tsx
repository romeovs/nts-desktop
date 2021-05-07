import * as React from "react"
import classnames from "classnames"

import "./global.css"

import { electron } from "./electron"
import { useLiveInfo } from "./lib/live"
import { useShowInfo } from "./lib/show"
import { useKeydown } from "./lib/use-keydown"
import { useEvent } from "./lib/use-event"
import { useOffline } from "./lib/use-offline"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"
import { Mixcloud } from "./mixcloud"
import { Show } from "./show"
import { Slider, Slide } from "./slider"
import { Arrow } from "./arrow"
import { Help } from "./help"
import { Offline } from "./offline"

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
	const [isShowingHelp, setIsShowingHelp] = React.useState(false)

	const [duration, setDuration] = React.useState(0)
	const [position, setPosition] = React.useState(0)
	const [looped, setLooped] = React.useState(0)
	const isOffline = useOffline()

	function next() {
		setIndex(idx => (idx + 1) % 3)
	}

	function prev() {
		setIndex(idx => (3 + idx - 1) % 3)
	}

	function togglePlaying() {
		setPlaying(playing => (playing ? null : indexToChannel[index]))
	}

	function onStop(channel: Channel) {
		setPlaying(curr => (curr === channel ? null : curr))
	}

	function onStopAny() {
		setPlaying(null)
	}

	function seek(pos: number) {
		setPosition(pos)
		if (pos < position) {
			setLooped(x => x + 1)
		}
	}

	React.useEffect(function () {
		live.load()
	}, [])

	useKeydown("ArrowRight", next)
	useKeydown("ArrowLeft", prev)
	useKeydown("?", () => setIsShowingHelp(x => !x))
	useKeydown(" ", togglePlaying, [playing, index])

	useEvent("drop", async function (url: string) {
		await show.load(url)
		setPlaying("show")
		setIndex(channelToIndex.show)
	})

	useEvent("open", async function () {
		await live.load()
		setIsOpen(true)
	})

	useEvent(
		"close",
		function () {
			setIsOpen(false)

			if (!playing) {
				return
			}

			// Move the slider to the item that is currently playing
			const idx = channelToIndex[playing]
			setIndex(idx)
		},
		[playing],
	)

	React.useEffect(
		function () {
			setPosition(0)
			setLooped(0)
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

			if (left < 0) {
				return
			}

			const t = setTimeout(live.load, left + 500)
			return () => clearTimeout(t)
		},
		[live.data?.channel1.now.ends, live.data?.channel2.now.ends],
	)

	React.useEffect(
		function () {
			if (isOffline) {
				stopAny()
				return
			}

			live.load()
		},
		[isOffline],
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
						onStop={onStopAny}
					/>
				</Slide>
				<Slide>
					<Channel
						info={live.data?.channel2}
						channel={2}
						playing={playing === 2}
						onPlay={() => setPlaying(2)}
						onStop={onStopAny}
					/>
				</Slide>
				<Slide>
					<Show
						show={show.data}
						onPlay={() => setPlaying("show")}
						onStop={onStopAny}
						onSeek={seek}
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
			<Player src={streams[1]} playing={playing === 1} onPlay={() => setPlaying(1)} onStop={() => onStop(1)} />
			<Player src={streams[2]} playing={playing === 2} onPlay={() => setPlaying(2)} onStop={() => onStop(2)} />
			<Mixcloud
				key={`${show.data?.mixcloud}_${looped}`}
				show={show.data}
				playing={playing === "show"}
				onPlay={() => setPlaying("show")}
				onStop={() => onStop("show")}
				onLoad={dur => setDuration(Math.round(dur))}
				onProgress={pos => setPosition(Math.round(pos))}
				position={position}
			/>
			<Offline hide={!isOffline} />
			<Help hide={!isShowingHelp} onHide={() => setIsShowingHelp(false)} />
		</>
	)
}
