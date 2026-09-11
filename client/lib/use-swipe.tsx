import { type RefObject, useEffect } from "react"

// Enough horizontal travel to read as a deliberate gesture rather than a hand
// drifting sideways while scrolling.
const THRESHOLD = 80

// A trackpad swipe arrives as a run of wheel events, so the travel is summed
// and forgotten again once the gesture stops.
const IDLE = 200

export function useSwipe(
	ref: RefObject<HTMLElement | null>,
	onSwipe: () => void,
	enabled = true,
) {
	useEffect(
		function () {
			const el = ref.current
			if (!el || !enabled) {
				return
			}

			let travelled = 0
			let idle: ReturnType<typeof setTimeout>

			function handle(evt: WheelEvent) {
				// Let vertical scrolling through untouched.
				if (Math.abs(evt.deltaX) <= Math.abs(evt.deltaY)) {
					return
				}

				travelled += evt.deltaX
				clearTimeout(idle)
				idle = setTimeout(() => {
					travelled = 0
				}, IDLE)

				if (Math.abs(travelled) > THRESHOLD) {
					travelled = 0
					onSwipe()
				}
			}

			el.addEventListener("wheel", handle, { passive: true })
			return function () {
				clearTimeout(idle)
				el.removeEventListener("wheel", handle)
			}
		},
		[ref, onSwipe, enabled],
	)
}
