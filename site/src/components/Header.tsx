import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { cellVars } from "./Cell";
import { Rule } from "./Rule";

export interface HeaderProps {
	cols: number;
	title: string;
	/**
	 * Rules above and below. Dropped when the viewport is too short to spend
	 * three of its rows on chrome -- see the ChromeKind ladder in lib/layout.
	 */
	rules?: boolean;
}

/**
 * Stack-mode chrome: rule, plain-text title, rule. Replaces drawHeader()
 * (main.ts:215-232). The old `headerBottom` global becomes a grid-row fact,
 * and the row count is now a layout region rather than a constant here.
 */
export function Header(props: HeaderProps): JSX.Element {
	return (
		<header class="header">
			<Show when={props.rules}>
				<Rule cols={props.cols} />
			</Show>
			<h1 class="cell header__title" style={cellVars(props.cols, 1)}>
				{props.title}
			</h1>
			<Show when={props.rules}>
				<Rule cols={props.cols} />
			</Show>
		</header>
	);
}
