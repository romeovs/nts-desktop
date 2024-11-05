import { useCallback } from "react"

import { login } from "./lib/firebase"
import { usePreferences } from "./lib/preferences"

import css from "./login.module.css"

type LoginProps = {
	onClose: () => void
}

export function Login(props: LoginProps) {
	const { preferences, updatePreferences } = usePreferences()
	const { onClose } = props

	const handleSubmit = useCallback(
		async function (data: FormData) {
			const email = data.get("email")?.toString() ?? null
			const password = data.get("password")?.toString() ?? null

			if (!email || !password) {
				return
			}

			try {
				const ok = await login(email, password)
				console.log("OK", email, ok)

				updatePreferences((prefs) => ({ ...prefs, email, password }))
				onClose()
			} catch (err) {
				//
			}
		},
		[onClose, updatePreferences],
	)

	return (
		// @ts-expect-error: form action type is not a string
		<form className={css.login} action={handleSubmit}>
			<label htmlFor="email">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				defaultValue={preferences.email ?? ""}
			/>

			<label htmlFor="password">Password</label>
			<input
				id="password"
				type="password"
				name="password"
				required
				defaultValue={preferences.password ?? ""}
			/>

			<button type="submit">Log in</button>
		</form>
	)
}
