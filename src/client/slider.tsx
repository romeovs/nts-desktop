import * as React from "react"
import css from "./slider.module.css"

type SliderProps = {
	index: number
	children: React.ReactElement[]
}

export function Slider(props: SliderProps) {
	const { index, children } = props
	const style = {
		width: `${React.Children.count(children) * 100}vw`,
		transform: `translateX(${-index * 100}vw)`,
	}

	return (
		<div className={css.slider} style={style}>
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
