import * as React from "react"

type Props = {
	src: string
	playing: boolean
}

export function Player(props: Props) {
	const { src, playing } = props

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
		[playing, src],
	)

	return <audio src={src} ref={ref} />
}
