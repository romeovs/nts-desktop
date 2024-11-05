import classnames from "classnames"
import { useEffect, useState } from "react"

import css from "./volume.module.css"

type VolumeProps = {
	volume?: number
}

export function Volume(props: VolumeProps) {
	const { volume = 1 } = props
	const [show, setShow] = useState(false)
	const [init, setInit] = useState(false)

	useEffect(
		function () {
			const _ = volume

			setInit(true)

			if (!init) {
				return
			}

			setShow(true)

			const t = setTimeout(() => setShow(false), 750)
			return () => clearTimeout(t)
		},
		[volume, init],
	)

	return (
		<div
			className={classnames(css.volume, show && css.show)}
			style={{ height: `${100 * volume}%` }}
		/>
	)
}
