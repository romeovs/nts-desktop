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

	useEffect(function () {
		const readyState = ref.current?.readyState ?? 0
		if (readyState >= 3) {
			return
		}

		ref.current?.load()
	}, [])

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
			if (!playing) {
				ref.current?.pause()
				return
			}

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
