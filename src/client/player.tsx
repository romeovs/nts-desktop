import * as React from "react"

type Props = {
	src: string
	playing: boolean
	onPlay: () => void
	onStop: () => void
}

export function Player(props: Props) {
	const { src, playing, onStop, onPlay } = props

	const ref = React.useRef<HTMLAudioElement | null>(null)

	React.useEffect(function () {
		ref.current?.addEventListener("play", onPlay)
		ref.current?.addEventListener("pause", onStop)
		ref.current?.addEventListener("stop", onStop)
		ref.current?.load()
	}, [])

	React.useEffect(
		function () {
			if (!playing) {
				ref.current?.pause()
				return
			}

			ref.current?.load()
			ref.current?.play()
		},
		[playing, src],
	)

	return <audio src={playing ? src : ""} ref={ref} />
}
