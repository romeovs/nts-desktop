import classnames from "classnames"

import css from "./play.module.css"

type Props = {
	playing: boolean
	className?: string
}

export function PlayButton(props: Props) {
	const { playing, className } = props

	const classname = classnames(css.play, className)

	if (playing) {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 600 600"
				className={classname}
			>
				<path d="M446.4 145H153.6c-4.7 0-8.6 3.9-8.6 8.6v292.8c0 4.7 3.9 8.6 8.6 8.6h292.8c4.7 0 8.6-3.9 8.6-8.6V153.6c0-4.7-3.9-8.6-8.6-8.6z" />
			</svg>
		)
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 600 600"
			className={classname}
		>
			<path d="M506.4 309.3L128.8 519.2c-4.4 2.4-8.2 2.7-11.2 1-3.1-1.7-4.6-5.1-4.6-10.2V91.2c0-4.8 1.5-8.2 4.6-10.2 3.1-2 6.8-1.7 11.2 1l377.6 210c4.4 2.4 6.6 5.3 6.6 8.7 0 3.3-2.2 6.2-6.6 8.6z" />
		</svg>
	)
}
