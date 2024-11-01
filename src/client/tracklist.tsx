import classnames from "classnames"
import { electron } from "./electron"
import css from "./tracklist.module.css"

type Props = {
	channel: 1 | 2 | "show"
	hasShow: boolean
	hasTracks: boolean
	onShowTracklist: () => void
}

export function Tracklist(props: Props) {
	const { channel, hasShow, hasTracks, onShowTracklist } = props

	function handleClick() {
		if (channel === "show" || (channel && hasTracks)) {
			onShowTracklist()
			return
		}

		electron.send("tracklist", channel)
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={classnames(css.tracklist, channel === "show" && !hasShow && css.disable)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<path d="M2.87 14.49h8V13h-8zm12-5h-12V11h12zm0-3.5h-12v1.5h12zm6.26 3.34l-2.88-1v7a2.67 2.67 0 01-2 2.61 2.53 2.53 0 01-2.88-1.44 2.73 2.73 0 01.71-3.24 2.49 2.49 0 013.2 0V6l3.84 1.33z" />
			</svg>
		</button>
	)
}
