import * as React from "react"
import css from "./slider.module.css"

type SliderProps = {
	index: number
	children: React.ReactElement[]
	animate: boolean
}

export function Slider(props: SliderProps) {
	const { index, children, animate } = props

	const style = {
		width: `${React.Children.count(children) * 100}vw`,
		transform: `translateX(${-index * 100}vw)`,
		transition: animate ? "transform 500ms" : "",
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
