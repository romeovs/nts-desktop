import classnames from "classnames"
import css from "./styles.module.css"

type IndicatorProps = {
	className?: string
}

export function Indicator(props: IndicatorProps) {
	return <div className={classnames(css.indicator, props.className)}>●</div>
}
