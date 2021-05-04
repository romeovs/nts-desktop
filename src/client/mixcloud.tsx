import * as React from "react"

type Props = {
	show: Show | null
	playing: boolean
}

interface PlayerWidget {
	play(): void
	pause(): void
	load(key: string, startPlaying?: boolean): void
	ready: Promise<void>
}

export function Mixcloud(props: Props) {
	const { show, playing } = props

	const ref = React.useRef<HTMLDivElement | null>(null)
	const widget = React.useRef<PlayerWidget | null>(null)
	React.useEffect(function () {
		if (!ref.current) {
			return
		}

		// @ts-expect-error
		const w = window.Mixcloud.PlayerWidget(ref.current) as PlayerWidget
		w.ready.then(function () {
			widget.current = w

			console.log("HERE", w)
		})
	}, [])

	React.useEffect(
		function () {
			if (!show) {
				widget.current?.pause()
				return
			}

			widget.current?.load(key(show.mixcloud), playing)
		},
		[show],
	)

	React.useEffect(
		function () {
			if (playing && show) {
				widget.current?.play()
				return
			}

			widget.current?.pause()
		},
		[playing],
	)

	const k = show && encodeURIComponent(key(show.mixcloud))
	return (
		<iframe
			ref={ref}
			src={k && `http://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&feed=${encodeURIComponent(k)}`}
		/>
	)
}

function key(url: string) {
	return url.replace(/^https:\/\/www\.mixcloud\.com/, "")
}
