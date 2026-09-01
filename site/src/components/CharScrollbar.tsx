import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { cellVars } from "./Cell";

export interface CharScrollbarProps {
	/** Visible rows the bar spans. */
	count: number;
	/** Current offset, in rows. */
	scroll: number;
	/** Total content height, in rows. */
	total: number;
}

function scrollbarChars(count: number, scroll: number, total: number): string {
	const pct = Math.min(1, Math.max(0, scroll / Math.max(1, total - count)));
	const height = Math.max((count / Math.max(count, total)) * count, 1);
	const start = pct * (count - height);
	const s = Math.floor(start);
	const e = Math.floor(start + height) - 1;

	const out: string[] = new Array(count);
	for (let i = 0; i < count; i++) {
		out[i] = i < s || i > e ? "|" : i === s ? "n" : i === e ? "u" : "#";
	}
	return out.join("\n");
}

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
