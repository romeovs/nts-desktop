import classnames from "classnames"

import { Logo } from "./logo"
import css from "./splash.module.css"

type Props = {
	hide: boolean
}

export function Splash(props: Props) {
	const { hide } = props

	return (
		<div className={classnames(css.splash, hide && css.hide)}>
			<Logo className={css.logo} />
		</div>
	)
}
