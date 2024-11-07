import { useCallback, useEffect, useState } from "react"

import "./global.css"

import { type Stream, streams } from "~/lib/stream"

import { electron } from "./electron"
import { useLiveInfo } from "./lib/live"
import { useLiveTracks } from "./lib/live-tracks"
import { usePreferences } from "./lib/preferences"
import { useEvent } from "./lib/use-event"
import { useKeydown } from "./lib/use-keydown"
import { useOffline } from "./lib/use-offline"

import type { ShowInfo } from "../app/show"
import { Arrow } from "./arrow"
import { Channel as ChannelCard } from "./channel"
import { Chat } from "./chat"
import { Help } from "./help"
import { Login } from "./login"
import { Mixcloud } from "./mixcloud"
import { Offline } from "./offline"
import { Player } from "./player"
import { Show } from "./show"
import { Slide, Slider } from "./slider"
import { Soundcloud } from "./soundcloud"
import { Splash } from "./splash"
import { Tracklist } from "./tracklist"
import { Volume } from "./volume"

import css from "./app.module.css"

type Channel = Stream | "show"

const channelToIndex: Record<Channel, number> = {
	1: 0,
	2: 1,
	show: 2,
}

const indexToChannel: Channel[] = [1, 2, "show"]

export function App() {
	const [route, setRoute] = useState<"app" | "login">("app")

	useEvent("login", () => setRoute("login"), [setRoute])
	useEvent("close", () => setRoute("app"), [setRoute])

	const handleLoginClose = useCallback(function () {
		setRoute("app")
	}, [])

	if (route === "login") {
		return <Login onClose={handleLoginClose} />
	}

	return <NTS />
}

export function NTS() {
	const live = useLiveInfo()
	const [show, setShow] = useState<ShowInfo | null>(null)
	const { preferences, updatePreferences } = usePreferences()

	const [index, setIndex] = useState<number>(0)
	const [playing, setPlaying] = useState<Channel | null>(null)
	const [isOpen, setIsOpen] = useState(document.hasFocus())
	const [isShowingHelp, setIsShowingHelp] = useState(false)
	const [duration, setDuration] = useState(0)
	const [position, setPosition] = useState(0)
	const [looped, setLooped] = useState(0)
	const isOffline = useOffline()

	const setVolume = useCallback(
		function (fn: (volume: number) => number) {
			updatePreferences((prefs) => ({ ...prefs, volume: fn(prefs.volume) }))
		},
		[updatePreferences],
	)

	const tracks1 = useLiveTracks(1)
	const tracks2 = useLiveTracks(2)
	const currentTracks = playing === 1 ? tracks1 : tracks2

	const next = useCallback(function () {
		setIndex((idx) => (idx + 1) % 3)
	}, [])

	const prev = useCallback(function () {
		setIndex((idx) => (3 + idx - 1) % 3)
	}, [])

	const togglePlaying = useCallback(
		function () {
			if (isOffline) {
				return
			}

			setPlaying((playing) => (playing ? null : indexToChannel[index]))
		},
		[index, isOffline],
	)

	const stop = useCallback(function (channel: Channel) {
		setPlaying((curr) => (curr === channel ? null : curr))
	}, [])

	const stopAll = useCallback(function () {
		setPlaying(null)
	}, [])

	const seek = useCallback(
		function (pos: number) {
			setPosition(pos)
			if (pos < position) {
				setLooped((x) => x + 1)
			}
		},
		[position],
	)

	const close = useCallback(function () {
		electron.send("close")
	}, [])

	useEffect(
		function () {
			electron.send("playing", playing)
		},
		[playing],
	)

	useEffect(
		function () {
			if (!playing) {
				document.title = "NTS"
				navigator.mediaSession.metadata = null
			}

			if (playing === 1) {
				if (live.data) {
					document.title = `NTS 1 - ${live.data?.channel1.now.name}`
				} else {
					document.title = "NTS 1"
				}
			}
			if (playing === 2) {
				if (live.data) {
					document.title = `NTS 2 - ${live.data?.channel2.now.name}`
				} else {
					document.title = "NTS 2"
				}
			}
			if (playing === "show") {
				if (show) {
					document.title = `NTS - ${show.name}`
				} else {
					document.title = "NTS"
				}
			}
		},
		[playing, show, live],
	)

	const increaseVolume = useCallback(
		function () {
			setVolume((v: number): number => clamp(0, 1, v + 0.1))
		},
		[setVolume],
	)

	const decreaseVolume = useCallback(
		function () {
			setVolume((v: number): number => clamp(0, 1, v - 0.1))
		},
		[setVolume],
	)

	useKeydown("ArrowRight", next)
	useKeydown("ArrowLeft", prev)
	useKeydown("?", () => setIsShowingHelp((x) => !x))
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
		setPosition(0)
		setLooped(0)
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

	useEffect(
		function () {
			if (!live.data) {
				return
			}
			const ends1 = live.data.channel1.now.ends
			const left = ends1.getTime() - Date.now()

			if (left < 0) {
				return
			}

			const t = setTimeout(live.load, left + 500)
			return () => clearTimeout(t)
		},
		[live.data, live.load],
	)

	useEffect(
		function () {
			if (isOffline) {
				stopAll()
				return
			}

			live.load()
		},
		[isOffline, stopAll, live.load],
	)

	const handleShowTracklist = useCallback(function () {
		const all = document.querySelectorAll("[data-show]")
		for (const el of all) {
			el.scrollTo({
				top: 220,
				behavior: "smooth",
			})
		}
	}, [])

	const handleShowPlay = useCallback(function () {
		setPlaying("show")
	}, [])

	const handleShowStop = useCallback(
		function () {
			stop("show")
		},
		[stop],
	)

	const handleShowLoad = useCallback(function (dur: number) {
		setDuration(Math.round(dur))
	}, [])

	const handleShowProgress = useCallback(function (pos: number) {
		setPosition(Math.round(pos))
	}, [])

	return (
		<>
			<Splash hide={Boolean(!live.loading || live.data)} />
			<Slider index={index} animate={isOpen}>
				<Slide>
					<ChannelCard
						info={live.data?.channel1}
						channel={1}
						playing={playing === 1}
						onPlay={() => setPlaying(1)}
						onStop={stopAll}
						tracks={tracks1}
					/>
				</Slide>
				<Slide>
					<ChannelCard
						info={live.data?.channel2}
						channel={2}
						playing={playing === 2}
						onPlay={() => setPlaying(2)}
						onStop={stopAll}
						tracks={tracks2}
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
			<Tracklist
				channel={indexToChannel[index]}
				hasShow={Boolean(show)}
				onShowTracklist={handleShowTracklist}
				hasTracks={currentTracks.length > 0}
			/>
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
					onPlay={handleShowPlay}
					onStop={handleShowStop}
					onLoad={handleShowLoad}
					onProgress={handleShowProgress}
					position={position}
					volume={preferences.volume}
				/>
			)}
			{show?.source?.source === "soundcloud" && (
				<Soundcloud
					key={`${show?.source?.url}_soundcloud`}
					show={show}
					playing={playing === "show"}
					onPlay={handleShowPlay}
					onStop={handleShowStop}
					onLoad={handleShowLoad}
					onProgress={handleShowProgress}
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
