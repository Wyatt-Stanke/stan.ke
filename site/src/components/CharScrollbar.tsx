import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { scrollbarChars } from "../lib/scrollbar";
import { cellVars } from "./Cell";

export interface CharScrollbarProps {
	/** Visible rows the bar spans. */
	count: number;
	/** Current offset, in rows. */
	scroll: number;
	/** Total content height, in rows. */
	total: number;
}

/** The `| n u #` scrollbar. Render half of drawScrollBar() (main.ts:234-262). */
export function CharScrollbar(props: CharScrollbarProps): JSX.Element {
	const bar = createMemo(() =>
		scrollbarChars(props.count, props.scroll, props.total),
	);

	return (
		<pre
			class="cell scrollbar"
			aria-hidden="true"
			style={cellVars(1, props.count)}
		>
			{bar()}
		</pre>
	);
}
