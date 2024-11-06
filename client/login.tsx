import { useCallback } from "react"

import { electron } from "./electron"

import css from "./login.module.css"

type LoginProps = {
	onClose: () => void
}

export function Login(props: LoginProps) {
	const { onClose } = props

	const handleSubmit = useCallback(
		async function (data: FormData) {
			const email = data.get("email")?.toString() ?? null
			const password = data.get("password")?.toString() ?? null

			if (!email || !password) {
				return
			}

			try {
				await electron.invoke("login-credentials", { email, password })
				onClose()
			} catch (err) {
				// TODO: show error
				console.log("HERE", err)
			}
		},
		[onClose],
	)

	return (
		// @ts-expect-error: form action type is not a string
		<form className={css.login} action={handleSubmit}>
			<label htmlFor="email">Email</label>
			<input id="email" name="email" type="email" required />

			<label htmlFor="password">Password</label>
			<input id="password" type="password" name="password" required />

			<button type="submit">Log in</button>
		</form>
	)
}
