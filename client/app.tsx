import { useCallback, useEffect, useState } from "react"

import "./global.css"

import { type Stream, streams } from "~/lib/stream"
import type { ShowInfo } from "../app/show"
import { About } from "./about"
import css from "./app.module.css"
import { Arrow } from "./arrow"
import { Channel as ChannelCard } from "./channel"
import { electron } from "./electron"
import { Favourite } from "./favourite"
import { Favourites } from "./favourites"
import { Help } from "./help"
import { useLiveInfo } from "./lib/live"
import { useLiveTracks } from "./lib/live-tracks"
import { usePreferences } from "./lib/preferences"
import { useEvent } from "./lib/use-event"
import { useKeydown } from "./lib/use-keydown"
import { useOffline } from "./lib/use-offline"
import { LoadShow } from "./load-show"
import { Login } from "./login"
import { useMetadata } from "./metadata"
import { Mixcloud } from "./mixcloud"
import { Notifications } from "./notifications"
import { Offline } from "./offline"
import { Player } from "./player"
import { Schedule } from "./schedule"
import { Show } from "./show"
import { Slide, Slider } from "./slider"
import { Soundcloud } from "./soundcloud"
import { Splash } from "./splash"
import { Volume } from "./volume"

type Channel = Stream | "show"

const channelToIndex: Record<Channel, number> = {
	1: 0,
	2: 1,
	show: 2,
}

type SlideName = Channel | "schedule"

const indexToSlide: SlideName[] = [1, 2, "show", "schedule"]
const SLIDES = indexToSlide.length

export function App() {
	const [route, setRoute] = useState<"app" | "login">("app")

	useEvent("login", () => setRoute("login"), [setRoute])
	useEvent("close", () => setRoute("app"), [setRoute])

	const handleLoginClose = useCallback(function () {
		setRoute("app")
	}, [])

	return (
		<>
			<NTS />
			<Login onClose={handleLoginClose} show={route === "login"} />
			<Notifications />
		</>
	)
}

export function NTS() {
	const [show, setShow] = useState<ShowInfo | null>(null)
	// The archive slide shows either the loaded show or the favourites list. The
	// audio elements live outside the slider, so browsing does not stop playback.
	const [browsing, setBrowsing] = useState(false)
	const { preferences, updatePreferences } = usePreferences()

	const [index, setIndex] = useState<number>(0)
	const [playing, setPlaying] = useState<Channel | null>(null)
	const [isOpen, setIsOpen] = useState(document.hasFocus())
	const [isShowingHelp, setIsShowingHelp] = useState(false)
	const [isShowingAbout, setIsShowingAbout] = useState(false)
	const [loadShow, setLoadShow] = useState<string | null>(null)
	const [duration, setDuration] = useState(0)
	const [position, setPosition] = useState(0)
	const [looped, setLooped] = useState(0)
	const isOffline = useOffline()
	const live = useLiveInfo({ skip: isOffline })
	useMetadata(playing, show, live)

	const setVolume = useCallback(
		function (fn: (volume: number) => number) {
			updatePreferences((prefs) => ({ ...prefs, volume: fn(prefs.volume) }))
		},
		[updatePreferences],
	)

	const tracks1 = useLiveTracks(1)
	const tracks2 = useLiveTracks(2)

	// Whatever is on air on the channel being looked at, which is what the
	// favourite button acts on.
	const liveShow =
		index === 0
			? live.data?.channel1.now
			: index === 1
				? live.data?.channel2.now
				: null

	const next = useCallback(function () {
		setIndex((idx) => (idx + 1) % SLIDES)
	}, [])

	const prev = useCallback(function () {
		setIndex((idx) => (SLIDES + idx - 1) % SLIDES)
	}, [])

	const togglePlaying = useCallback(
		function () {
			if (isOffline) {
				return
			}

			setPlaying(function (playing) {
				if (playing) {
					return null
				}

				const slide = indexToSlide[index]
				return slide === "schedule" ? null : slide
			})
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

	const close = useCallback(
		function () {
			// Escape backs out of whatever is on top before it closes the window.
			if (isShowingAbout) {
				setIsShowingAbout(false)
				return
			}

			if (isShowingHelp) {
				setIsShowingHelp(false)
				return
			}

			if (loadShow !== null) {
				setLoadShow(null)
				return
			}

			electron.send("close")
		},
		[isShowingAbout, isShowingHelp, loadShow],
	)

	useEffect(
		function () {
			electron.send("playing", playing)
		},
		[playing],
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
	useKeydown("Escape", close, [isShowingAbout, isShowingHelp, loadShow])
	useKeydown("1", () => setPlaying(playing === 1 ? null : 1), [playing])
	useKeydown("2", () => setPlaying(playing === 2 ? null : 2), [playing])
	useKeydown("+", increaseVolume)
	useKeydown("-", decreaseVolume)
	useKeydown("ArrowUp", increaseVolume)
	useKeydown("ArrowDown", decreaseVolume)

	useEvent("about", () => setIsShowingAbout(true))
	useEvent("load-show", (suggestion: string) => setLoadShow(suggestion))

	useEvent("open-show", async function (show: ShowInfo) {
		setShow(show)
		setBrowsing(false)
		setPlaying("show")
		setIndex(channelToIndex.show)
		setPosition(0)
		setLooped(0)
	})

	useEvent("open", async function () {
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
			if (isOffline) {
				stopAll()
			}
		},
		[isOffline, stopAll],
	)

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
			<Splash hide={!live.loading} />
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
					{browsing || !show ? (
						<Favourites />
					) : (
						<Show
							show={show}
							onPlay={() => setPlaying("show")}
							onStop={stopAll}
							onSeek={seek}
							playing={playing === "show"}
							duration={duration}
							position={position}
						/>
					)}
				</Slide>
				<Slide>
					<Schedule live={live} />
				</Slide>
			</Slider>
			<button type="button" onClick={prev} className={css.prev}>
				<Arrow direction="left" />
			</button>
			<button type="button" onClick={next} className={css.next}>
				<Arrow direction="right" />
			</button>
			{(indexToSlide[index] === 1 || indexToSlide[index] === 2) && (
				<Favourite show={liveShow?.show ?? ""} episode={liveShow?.episode ?? ""} />
			)}
			{indexToSlide[index] === "show" && show && !browsing && (
				<button
					type="button"
					className={css.back}
					onClick={() => setBrowsing(true)}
					title="Back to favourites"
				>
					<Arrow direction="left" />
				</button>
			)}
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
			<About hide={!isShowingAbout} onHide={() => setIsShowingAbout(false)} />
			<LoadShow
				show={loadShow !== null}
				suggestion={loadShow ?? ""}
				onClose={() => setLoadShow(null)}
			/>
			<Volume volume={preferences.volume} />
		</>
	)
}

function clamp(min: number, max: number, number: number): number {
	return Math.min(max, Math.max(min, number))
}
