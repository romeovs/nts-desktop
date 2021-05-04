import * as React from "react"
import css from "./show.module.css"

import type { Show } from "./lib/show"

type Props = {
	show: Show | null
}

export function Show(props: Props) {
	const { show } = props

	if (!show) {
		return (
			<div className={css.empty}>
				<div>Drop a link on the menu to load a show</div>
			</div>
		)
	}

	console.log("HERE", show)

	return <div>OK</div>
}
