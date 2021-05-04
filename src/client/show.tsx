import * as React from "react"
import css from "./show.module.css"

type Props = {
	url: string
}

export function Show(props: Props) {
	const { url } = props

	if (!url) {
		return (
			<div className={css.empty}>
				<div>Drop a link on the menu to load a show</div>
			</div>
		)
	}

	return <div> OK </div>
}
