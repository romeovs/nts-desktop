import { type FormEvent, useCallback } from "react"

import { electron } from "./electron"

import css from "./login.module.css"
import { notify } from "./notifications"

type LoginProps = {
	onClose: () => void
}

export function Login(props: LoginProps) {
	const { onClose } = props

	const handleSubmit = useCallback(
		async function (evt: FormEvent<HTMLFormElement>) {
			evt.preventDefault()
			const data = new FormData(evt.target as HTMLFormElement)
			const email = data.get("email")?.toString() ?? null
			const password = data.get("password")?.toString() ?? null

			if (!email || !password) {
				return
			}

			try {
				await electron.invoke("login-credentials", { email, password })
				onClose()
			} catch (err) {
				notify({ message: "invalid credentials", ttl: 4000, type: "error" })
			}
		},
		[onClose],
	)

	return (
		<form className={css.login} onSubmit={handleSubmit}>
			<label htmlFor="email">Email</label>
			<input id="email" name="email" type="email" required />

			<label htmlFor="password">Password</label>
			<input id="password" type="password" name="password" required />

			<button type="submit">Log in</button>
		</form>
	)
}
