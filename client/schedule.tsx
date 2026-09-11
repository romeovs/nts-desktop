import classnames from "classnames"
import { useCallback, useEffect, useState } from "react"

import { electron } from "./electron"
import type { InfoState, ShowInfo } from "./lib/live"
import { useEvent } from "./lib/use-event"
import { notify } from "./notifications"

import css from "./schedule.module.css"

type Props = {
	live: InfoState
}

export function Schedule(props: Props) {
	const { live } = props

	const [marked, setMarked] = useState<string[]>([])

	useEffect(function () {
		electron
			.invoke("reminders")
			.then(setMarked)
			.catch(() => setMarked([]))
	}, [])

	// The main process drops a reminder once it has fired.
	useEvent("reminders", (list: string[]) => setMarked(list))

	const channels: [1 | 2, ShowInfo[]][] = [
		[1, live.data?.channel1.upcoming ?? []],
		[2, live.data?.channel2.upcoming ?? []],
	]

	return (
		<div className={css.schedule}>
			<div className={css.heading}>Up next</div>
			<div className={css.columns}>
				{channels.map(function ([channel, shows]) {
					return (
						<div key={channel} className={css.column}>
							<div className={css.channel}>Channel {channel}</div>
							{shows.length === 0 && <div className={css.empty}>—</div>}
							<ul className={css.list}>
								{shows.map(function (show) {
									return (
										<Entry
											key={show.starts.toISOString()}
											channel={channel}
											show={show}
											marked={marked.includes(
												`${channel}:${show.starts.toISOString()}`,
											)}
											onChange={setMarked}
										/>
									)
								})}
							</ul>
						</div>
					)
				})}
			</div>
		</div>
	)
}

type EntryProps = {
	channel: 1 | 2
	show: ShowInfo
	marked: boolean
	onChange: (marked: string[]) => void
}

function Entry(props: EntryProps) {
	const { channel, show, marked, onChange } = props

	const handleClick = useCallback(
		async function () {
			try {
				await electron.invoke("remind", {
					channel,
					name: show.name,
					starts: show.starts.toISOString(),
				})
				onChange(await electron.invoke("reminders"))
			} catch (err) {
				const message = err instanceof Error ? err.message : "could not set that"
				notify({ message: strip(message), ttl: 3000 })
			}
		},
		[channel, show.name, show.starts, onChange],
	)

	return (
		<li className={css.entry}>
			<span className={css.info}>
				<span className={css.time}>{formatTime(show.starts)}</span>
				<span className={css.name}>{show.name}</span>
			</span>
			<button
				type="button"
				className={classnames(css.notify, marked && css.marked)}
				onClick={handleClick}
				title={marked ? "Cancel reminder" : "Notify me when this starts"}
			>
				<svg aria-hidden="true" viewBox="0 0 24 24">
					<path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 00-5-5.91V4a1 1 0 00-2 0v1.09A6 6 0 006 11v5l-2 2v1h16v-1l-2-2z" />
				</svg>
			</button>
		</li>
	)
}

function strip(message: string): string {
	return message.replace(/^Error invoking remote method '[^']+': Error: /, "")
}

// The schedule runs past midnight, so anything that is not today says which day
// it is rather than leaving a bare time to be misread.
function formatTime(date: Date): string {
	const time = date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
	})

	const now = new Date()
	const sameDay =
		date.getFullYear() === now.getFullYear() &&
		date.getMonth() === now.getMonth() &&
		date.getDate() === now.getDate()

	if (sameDay) {
		return time
	}

	const day = date.toLocaleDateString("en-GB", { weekday: "short" })
	return `${day} ${time}`
}
