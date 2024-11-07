import { createRef, useEffect, useState } from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"

import css from "./styles.module.css"

export type Notification = {
	message: string
	type: "info" | "error"
	created: number
	ttl: number
	id: number
	nodeRef: React.RefObject<HTMLDivElement>
}

type NotificationDefinition = {
	message: string
	type?: "info" | "error"
	ttl?: number
}

export function notify(defn: NotificationDefinition) {
	window.dispatchEvent(
		new CustomEvent<Notification>("notify", {
			detail: {
				message: defn.message,
				id: Math.random(),
				type: defn.type ?? "info",
				created: Date.now(),
				ttl: defn.ttl ?? 4000,
				nodeRef: createRef(),
			},
		}),
	)
}

export function Notifications() {
	const [notifications, setNotifications] = useState<Notification[]>([])

	useEffect(function () {
		function handler(evt: CustomEvent<Notification>) {
			const notification = evt.detail
			console.log("HERE", notification)
			setNotifications((notifications) => [...notifications, notification])
		}

		// @ts-expect-error
		window.addEventListener("notify", handler)
		// @ts-expect-error
		return () => window.removeEventListener("notify", handler)
	}, [])

	useEffect(
		function () {
			const ends = notifications.map(
				(notification) => notification.created + notification.ttl,
			)
			const next = Math.min(...ends)
			const diff = Math.max(0, next - Date.now())
			const t = setTimeout(
				() =>
					setNotifications((notifications) =>
						notifications.filter(
							(notification) => notification.created + notification.ttl > Date.now(),
						),
					),
				diff,
			)

			return () => clearTimeout(t)
		},
		[notifications],
	)

	return (
		<div className={css.toasts}>
			<TransitionGroup component={null} timeout={500} in>
				{notifications.map((notification) => (
					<CSSTransition
						key={notification.id}
						nodeRef={notification.nodeRef}
						classNames={css}
						addEndListener={(done) => {
							notification.nodeRef.current?.addEventListener(
								"transitionend",
								done,
								false,
							)
						}}
					>
						<Toast notification={notification} />
					</CSSTransition>
				))}
			</TransitionGroup>
		</div>
	)
}

function Toast(props: { notification: Notification }) {
	const { notification } = props
	return (
		<div className={css.toast} ref={notification.nodeRef}>
			{notification.message}
		</div>
	)
}
