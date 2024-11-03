import * as React from "react"

type Props = {
	direction: "left" | "right" | "top" | "bottom"
}

const angles = {
	left: -90,
	right: 90,
	top: 0,
	bottom: 180,
}

export function Arrow(props: Props) {
	const { direction } = props
	const style = {
		transform: `rotate(${angles[direction]}deg)`,
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 600 600"
			width="16"
			height="16"
			style={style}
		>
			<path
				fill="white"
				d="M117.2 450l-60.9-60L300 150l243.8 240-60.9 60L300 270 117.2 450z"
			/>
		</svg>
	)
}
