import classnames from "classnames"
import { type FormEvent, useEffect, useRef, useState } from "react"

import { electron } from "./electron"

import css from "./load-show.module.css"

type Props = {
	show: boolean
	suggestion: string
	onClose: () => void
}

export function LoadShow(props: Props) {
	const { show, suggestion, onClose } = props

	const [url, setUrl] = useState("")
	const input = useRef<HTMLInputElement | null>(null)

	// Opening the panel is the moment to offer whatever is on the clipboard,
	// since copying the link is how you get here in the first place.
	useEffect(
		function () {
			if (!show) {
				return
			}

			setUrl(suggestion)
			input.current?.focus()
			input.current?.select()
		},
		[show, suggestion],
	)

	function handleSubmit(evt: FormEvent<HTMLFormElement>) {
		evt.preventDefault()

		const trimmed = url.trim()
		if (!trimmed) {
			return
		}

		electron.send("open-show-url", trimmed)
		onClose()
	}

	return (
		<form className={classnames(css.load, show && css.show)} onSubmit={handleSubmit}>
			<div className={css.label}>Load archive show</div>
			<input
				ref={input}
				type="text"
				name="url"
				value={url}
				spellCheck={false}
				autoComplete="off"
				placeholder="https://www.nts.live/shows/…/episodes/…"
				onChange={(evt) => setUrl(evt.target.value)}
				onKeyDown={function (evt) {
					// The global Escape handler only listens on the body, so it never
					// sees the key while the field has focus.
					if (evt.key === "Escape") {
						onClose()
					}
				}}
			/>
			<div className={css.buttons}>
				<button type="button" onClick={onClose}>
					Cancel
				</button>
				<button type="submit">Load</button>
			</div>
		</form>
	)
}
