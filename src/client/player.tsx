import * as React from "react"

const streams = [
	"https://stream-relay-geo.ntslive.net/stream?client=NTSWebApp",
	"https://stream-relay-geo.ntslive.net/stream2?client=NTSWebApp",
]

type Props = {
	channel: number
	playing: boolean
}

export function Player(props: Props) {
	const { channel, playing } = props

	const ref = React.useRef<HTMLAudioElement | null>(null)
	React.useEffect(
		function () {
			if (!playing) {
				ref.current?.pause()
				return
			}

			ref.current?.load()
			ref.current?.play()
		},
		[playing, channel],
	)

	return <audio src={streams[channel % streams.length]} ref={ref} />
}
