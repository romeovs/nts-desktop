import * as React from "react"
import css from "./slider.module.css"

type SliderProps = {
	index: number
	children: React.ReactElement[]
	animate: boolean
}

function direction(
	prev: number,
	index: number,
	len: number,
): "prev" | "next" | null {
	if (prev === len - 1 && index === 0) {
		return "next"
	}
	if (index === len - 1 && prev === 0) {
		return "prev"
	}
	if (index > prev) {
		return "next"
	}

	if (index < prev) {
		return "prev"
	}

	return null
}

function diff(dir: "prev" | "next" | null) {
	if (dir === null) {
		return 0
	}
	if (dir === "next") {
		return 1
	}
	return -1
}

const time = 400

export function Slider(props: SliderProps) {
	const { index, children, animate } = props
	const len = React.Children.count(children)
	const [state, setState] = React.useState({
		animate,
		index,
		lastIndex: index,
	})

	React.useEffect(
		function () {
			setState((state) => ({
				animate: true,
				index: state.index + diff(direction(state.index, index, len)),
				lastIndex: state.index,
			}))

			const t = setTimeout(
				() =>
					setState((state) => ({
						...state,
						animate: false,
						index,
					})),
				time,
			)

			return () => clearTimeout(t)
		},
		[index],
	)

	const style = {
		width: `${3 * len * 100}vw`,
		transform: `translateX(${-(state.index + len) * 100}vw)`,
		transition: animate && state.animate ? `transform ${time}ms` : "",
	}

	return (
		<div className={css.slider} style={style}>
			{children}
			{children}
			{children}
		</div>
	)
}

type SlideProps = {
	children: React.ReactElement[] | React.ReactElement
}

export function Slide(props: SlideProps) {
	const { children } = props
	return <div className={css.slide}>{children}</div>
}
