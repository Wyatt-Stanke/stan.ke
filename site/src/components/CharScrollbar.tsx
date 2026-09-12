import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import { cellVars } from "./Cell";

/**
 * The bar as two fractions rather than as row counts, because its two callers
 * measure different things. The index knows its height exactly -- totalRows()
 * sums a model nothing has to observe -- while a post's height depends on how
 * the browser wrapped its prose, which is only knowable by measurement.
 */
export interface BarState {
	/** How far through the scrollable span, 0 at the top, 1 at the bottom. */
	progress: number;
	/** How much of the content is on screen, 0 to 1. */
	visible: number;
}

export interface CharScrollbarProps {
	/** Visible rows the bar spans. */
	count: number;
	state: BarState;
}

export const FULL_BAR: BarState = { progress: 0, visible: 1 };

const clamp01 = (v: number): number =>
	Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;

/** Rows of content per row of viewport, as the fractions the bar wants. */
export function barState(top: number, max: number, viewport: number): BarState {
	return {
		progress: max > 0 ? top / max : 0,
		visible: viewport > 0 ? viewport / (viewport + max) : 1,
	};
}

// Device pixel rounding causes the last cell to be weird sometimes
function scrollbarChars(count: number, state: BarState): string {
	const pct = clamp01(state.progress);
	const height = Math.min(
		count,
		Math.max(Math.round(clamp01(state.visible) * count), 1),
	);
	const s = Math.round(pct * (count - height));
	const e = s + height - 1;

	const out: string[] = new Array(count);
	for (let i = 0; i < count; i++) {
		out[i] = i < s || i > e ? "|" : i === s ? "n" : i === e ? "u" : "#";
	}
	return out.join("\n");
}

export function CharScrollbar(props: CharScrollbarProps): JSX.Element {
	const bar = createMemo(() => scrollbarChars(props.count, props.state));

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
