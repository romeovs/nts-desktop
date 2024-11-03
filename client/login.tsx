import { type ChangeEvent, type FormEvent, useCallback, useState } from "react"
import type { Preferences } from "./lib/preferences"

import css from "./login.module.css"

type LoginProps = {
	preferences: Preferences
	onPreferencesChange: (fn: (prefs: Preferences) => Preferences) => void
	onClose: () => void
}

export function Login(props: LoginProps) {
	const { onClose, onPreferencesChange, preferences } = props
	const [email, setEmail] = useState(preferences.email ?? "")
	const [password, setPassword] = useState(preferences.password ?? "")

	const handleEmailChange = useCallback(function (
		evt: ChangeEvent<HTMLInputElement>,
	) {
		setEmail(evt.target.value)
	}, [])

	const handlePasswordChange = useCallback(function (
		evt: ChangeEvent<HTMLInputElement>,
	) {
		setPassword(evt.target.value)
	}, [])

	const handleSubmit = useCallback(
		function (evt: FormEvent<HTMLFormElement>) {
			evt.preventDefault()
			onPreferencesChange((prefs) => ({ ...prefs, email, password }))
			onClose()
		},
		[onClose, email, password, onPreferencesChange],
	)

	return (
		<form onSubmit={handleSubmit} className={css.login}>
			<input type="email" value={email} onChange={handleEmailChange} />
			<input type="password" value={password} onChange={handlePasswordChange} />
			<button type="submit">Log in</button>
		</form>
	)
}
