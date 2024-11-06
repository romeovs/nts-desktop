import { useEffect, useRef } from "react"

type Props = {
	src: string
	playing: boolean
	onPlay: () => void
	onStop: () => void
	volume?: number
}

export function Player(props: Props) {
	const { src, playing, onStop, onPlay, volume = 1 } = props

	const ref = useRef<HTMLAudioElement | null>(null)

	useEffect(
		function () {
			ref.current?.addEventListener("play", onPlay)
			ref.current?.addEventListener("pause", onStop)
			ref.current?.addEventListener("stop", onStop)
		},
		[onPlay, onStop],
	)

	useEffect(
		function () {
			if (!ref.current) {
				return
			}

			if (!playing) {
				ref.current?.pause()
				return
			}

			ref.current.load()
			ref.current?.play()
		},
		[playing],
	)

	useEffect(
		function () {
			if (!ref.current) {
				return
			}
			ref.current.volume = volume
		},
		[volume],
	)

	return <audio src={src} ref={ref} />
}
