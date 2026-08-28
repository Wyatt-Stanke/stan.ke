import type { JSX } from "solid-js";
import { cellVars } from "./Cell";
import { Rule } from "./Rule";

export interface HeaderProps {
	cols: number;
	title: string;
}

/**
 * Stack-mode header: rule, plain-text title, rule. Replaces drawHeader()
 * (main.ts:215-232). The old `headerBottom` global becomes a grid-row fact.
 */
export function Header(props: HeaderProps): JSX.Element {
	return (
		<header class="header">
			<Rule cols={props.cols} />
			<h1 class="cell header__title" style={cellVars(props.cols, 1)}>
				{props.title}
			</h1>
			<Rule cols={props.cols} />
		</header>
	);
}
