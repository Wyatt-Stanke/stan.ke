import type { JSX } from "solid-js";
import { cellVars } from "./Cell";

export interface RuleProps {
	cols: number;
	char?: string;
}

/** A full-width horizontal rule of characters. Replaces main.ts:220-225. */
export function Rule(props: RuleProps): JSX.Element {
	return (
		<pre
			class="cell rule"
			aria-hidden="true"
			style={cellVars(props.cols, 1)}
		>
			{(props.char ?? "X").repeat(props.cols)}
		</pre>
	);
}
