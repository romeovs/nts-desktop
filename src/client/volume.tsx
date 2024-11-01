import classnames from "classnames"
import * as React from "react"

import css from "./volume.module.css"

type VolumeProps = {
	volume?: number
}

export function Volume(props: VolumeProps) {
	const { volume = 1 } = props
	const [show, setShow] = React.useState(false)
	const [init, setInit] = React.useState(false)

	React.useEffect(
		function () {
			setInit(true)

			if (!init) {
				return
			}
			setShow(true)

			const t = setTimeout(() => setShow(false), 500)
			return () => clearTimeout(t)
		},
		[volume],
	)

	return (
		<div
			className={classnames(css.volume, show && css.show)}
			style={{ height: `${100 * volume}%` }}
		/>
	)
}
