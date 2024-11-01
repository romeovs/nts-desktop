import * as React from "react"

import "./global.css"
import { usePreferences, Preferences } from "./lib/preferences"

import { electron } from "./electron"
import { useLiveInfo } from "./lib/live"
import type { ShowInfo } from "../show"
import { useKeydown } from "./lib/use-keydown"
import { useEvent } from "./lib/use-event"
import { useOffline } from "./lib/use-offline"

import { Splash } from "./splash"
import { Channel } from "./channel"
import { Player } from "./player"
import { Mixcloud } from "./mixcloud"
import { Soundcloud } from "./soundcloud"
import { Show } from "./show"
import { Slider, Slide } from "./slider"
import { Arrow } from "./arrow"
import { Help } from "./help"
import { Offline } from "./offline"
import { Volume } from "./volume"
import { Tracklist } from "./tracklist"
import { Chat } from "./chat"
import { Login } from "./login"

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
	const [route, setRoute] = React.useState<"app" | "login">("app")
	const [preferences, setPreferences] = usePreferences()

	React.useEffect(function () {
		electron.on("login", function () {
			setRoute("login")
		})
	}, [])

	const handleLoginClose = React.useCallback(function () {
		setRoute("app")
	}, [])

	if (route === "login") {
		return <Login onClose={handleLoginClose} preferences={preferences} onPreferencesChange={setPreferences} />
	}

	return <NTS preferences={preferences} onPreferencesChange={setPreferences} />
}

type NTSProps = {
	preferences: Preferences | null
	onPreferencesChange: (fn: (prefs: Preferences) => Preferences) => void
}

export function NTS(props: NTSProps) {
	const { preferences, onPreferencesChange } = props
	const live = useLiveInfo()
	const [show, setShow] = React.useState<ShowInfo | null>(null)

	const [index, setIndex] = React.useState<number>(0)
	const [playing, setPlaying] = React.useState<Channel | null>(null)
	const [isOpen, setIsOpen] = React.useState(document.hasFocus())
	const [isShowingHelp, setIsShowingHelp] = React.useState(false)
	const [duration, setDuration] = React.useState(0)
	const [position, setPosition] = React.useState(0)
	const [looped, setLooped] = React.useState(0)
	const isOffline = useOffline()

	function setVolume(fn: (volume: number) => number) {
		onPreferencesChange(prefs => ({ ...prefs, volume: fn(prefs.volume) }))
	}

	function next() {
		setIndex(idx => (idx + 1) % 3)
	}

	function prev() {
		setIndex(idx => (3 + idx - 1) % 3)
	}

	function togglePlaying() {
		if (isOffline) {
			return
		}

		setPlaying(playing => (playing ? null : indexToChannel[index]))
	}

	function stop(channel: Channel) {
		setPlaying(curr => (curr === channel ? null : curr))
	}

	function stopAll() {
		setPlaying(null)
	}

	function seek(pos: number) {
		setPosition(pos)
		if (pos < position) {
			setLooped(x => x + 1)
		}
	}

	function close() {
		electron.send("close")
	}

	React.useEffect(function () {
		live.load()
	}, [])

	React.useEffect(
		function () {
			electron.send("playing", playing)
		},
		[playing],
	)

	function increaseVolume() {
		setVolume((v: number): number => clamp(0, 1, v + 0.1))
	}

	function decreaseVolume() {
		setVolume((v: number): number => clamp(0, 1, v - 0.1))
	}

	useKeydown("ArrowRight", next)
	useKeydown("ArrowLeft", prev)
	useKeydown("?", () => setIsShowingHelp(x => !x))
	useKeydown(" ", togglePlaying, [playing, index])
	useKeydown("Escape", close)
	useKeydown("t", () => electron.send("tracklist", indexToChannel[index]), [index])
	useKeydown("c", () => electron.send("chat", indexToChannel[index]), [index])
	useKeydown("1", () => setPlaying(playing === 1 ? null : 1), [playing])
	useKeydown("2", () => setPlaying(playing === 2 ? null : 2), [playing])
	useKeydown("+", increaseVolume)
	useKeydown("-", decreaseVolume)
	useKeydown("ArrowUp", increaseVolume)
	useKeydown("ArrowDown", decreaseVolume)

	useEvent("open-show", async function (show: ShowInfo) {
		setShow(show)
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
		[show?.source?.url],
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
				stopAll()
				return
			}

			live.load()
		},
		[isOffline],
	)

	function handleShowTracklist() {
		if (!show) {
			return
		}

		const all = document.querySelectorAll("[data-show]")
		for (const el of all) {
			el.scrollTo({
				top: 220,
				behavior: "smooth",
			})
		}
	}

	return (
		<>
			<Splash hide={!live.loading} />
			<Slider index={index} animate={isOpen}>
				<Slide>
					<Channel
						info={live.data?.channel1}
						channel={1}
						playing={playing === 1}
						onPlay={() => setPlaying(1)}
						onStop={stopAll}
					/>
				</Slide>
				<Slide>
					<Channel
						info={live.data?.channel2}
						channel={2}
						playing={playing === 2}
						onPlay={() => setPlaying(2)}
						onStop={stopAll}
					/>
				</Slide>
				<Slide>
					<Show
						show={show}
						onPlay={() => setPlaying("show")}
						onStop={stopAll}
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
			<Tracklist channel={indexToChannel[index]} hasShow={Boolean(show)} onShowTracklist={handleShowTracklist} />
			<Chat channel={indexToChannel[index]} />
			<Player
				src={streams[1]}
				playing={playing === 1}
				onPlay={() => setPlaying(1)}
				onStop={() => stop(1)}
				volume={preferences.volume}
			/>
			<Player
				src={streams[2]}
				playing={playing === 2}
				onPlay={() => setPlaying(2)}
				onStop={() => stop(2)}
				volume={preferences.volume}
			/>
			{show?.source?.source === "mixcloud" && (
				<Mixcloud
					key={`${show?.source?.url}_${looped}_mixcloud`}
					show={show}
					playing={playing === "show"}
					onPlay={() => setPlaying("show")}
					onStop={() => stop("show")}
					onLoad={dur => setDuration(Math.round(dur))}
					onProgress={pos => setPosition(Math.round(pos))}
					position={position}
					volume={preferences.volume}
				/>
			)}
			{show?.source?.source === "soundcloud" && (
				<Soundcloud
					key={`${show?.source?.url}_soundcloud`}
					show={show}
					playing={playing === "show"}
					onPlay={() => setPlaying("show")}
					onStop={() => stop("show")}
					onLoad={dur => setDuration(Math.round(dur))}
					onProgress={pos => setPosition(Math.round(pos))}
					position={position}
					volume={preferences.volume}
				/>
			)}
			<Offline hide={!isOffline} />
			<Help hide={!isShowingHelp} onHide={() => setIsShowingHelp(false)} />
			<Volume volume={preferences.volume} />
		</>
	)
}

function clamp(min: number, max: number, number: number): number {
	return Math.min(max, Math.max(min, number))
}
