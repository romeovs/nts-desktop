import classnames from "classnames"
import * as React from "react"
import css from "./chat.module.css"
import { electron } from "./electron"

type Props = {
	channel: 1 | 2 | "show"
}

export function Chat(props: Props) {
	const { channel } = props

	function handleClick() {
		if (channel === "show") {
			return
		}

		electron.send("chat", channel)
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={classnames(css.chat, channel === "show" && css.disable)}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
				<path d="M493 391.73h-45.9v99.35l-128.18-99.35H118V144.92h375z"></path>
			</svg>
		</button>
	)
}
