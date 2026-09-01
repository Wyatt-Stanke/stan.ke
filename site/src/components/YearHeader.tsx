import type { JSX } from "solid-js";
import { FigText } from "./FigText";

export interface YearHeaderProps {
	year: number;
	art: string;
}

/**
 * A year is a fixed 23x4 footprint whatever the content is, unlike a post
 * title, so it does not feed the layout breakpoint -- see createLayout().
 */
export function YearHeader(props: YearHeaderProps): JSX.Element {
	return (
		<FigText
			as="h2"
			art={props.art}
			text={String(props.year)}
			class="group__year"
		/>
	);
}
