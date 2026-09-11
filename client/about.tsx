import classnames from "classnames"
import { useCallback, useEffect, useRef, useState } from "react"
import css from "./about.module.css"
import { Arrow } from "./arrow"
import { electron } from "./electron"
import { useSwipe } from "./lib/use-swipe"
import { Logo } from "./logo"

const SOURCE = "https://github.com/romeovs/nts-desktop"
const FORK = "https://github.com/ghetoblues/ntser"

type Props = {
	hide: boolean
	onHide: () => void
}

export function About(props: Props) {
	const { hide, onHide } = props

	const [version, setVersion] = useState("")

	// The panel covers the whole window, so a sideways swipe is the natural way
	// back out of it - the same gesture that moves between the screens beneath.
	const ref = useRef<HTMLDivElement>(null)
	useSwipe(ref, onHide, !hide)

	useEffect(function () {
		electron
			.invoke("version")
			.then(setVersion)
			.catch(() => setVersion(""))
	}, [])

	const handleLink = useCallback(function (evt: React.MouseEvent, url: string) {
		// The click would otherwise close the panel out from under the link.
		evt.stopPropagation()
		electron.send("open-link", url)
	}, [])

	return (
		<div
			ref={ref}
			className={classnames(css.about, hide && css.hide)}
			onClick={onHide}
			aria-hidden={hide}
		>
			<button
				type="button"
				className={css.exit}
				onClick={onHide}
				title="Back"
				tabIndex={hide ? -1 : 0}
			>
				<Arrow direction="right" />
			</button>

			<div className={css.inner}>
				<Logo className={css.logo} />
				<div className={css.name}>NTSer</div>
				{version && <div className={css.version}>Version {version}</div>}

				<p className={css.blurb}>Unofficial player, not affiliated with NTS.</p>

				<p className={css.credit}>
					Original app by Romeo Van Snick
					<br />
					<button
						type="button"
						className={css.link}
						onClick={(evt) => handleLink(evt, SOURCE)}
					>
						romeovs/nts-desktop
					</button>
				</p>

				<p className={css.credit}>
					Modified fork
					<br />
					<button
						type="button"
						className={css.link}
						onClick={(evt) => handleLink(evt, FORK)}
					>
						ghetoblues/ntser
					</button>
				</p>

				<div className={css.licence}>MIT · © 2022 Romeo Van Snick</div>
			</div>
		</div>
	)
}
