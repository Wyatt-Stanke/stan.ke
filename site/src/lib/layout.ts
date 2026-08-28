import { createMemo } from "solid-js";
import { MIN_ROW_COLS } from "./rows";

export type LayoutMode = "split" | "stack";

/** Rows occupied by the stack-mode header: rule, title, rule. */
export const HEADER_ROWS = 3;

/**
 * Ports chooseLayout() and splitLeftCols() (main.ts:123-135), with the second
 * term changed: the threshold used to be the widest figlet *post title*, which
 * made the breakpoint a property of whatever happened to be published. Post
 * titles are plain text now, so the list has a fixed minimum instead
 * (MIN_ROW_COLS) and the breakpoint is stable across content.
 *
 * Still has to be JS, not a container query: `var()` is illegal in a
 * @container condition, the title term is runtime figlet output, and the two
 * modes are different DOM, not different CSS.
 */
export function createLayout(cols: () => number, titleW: () => number) {
	const mode = createMemo<LayoutMode>(() => {
		if (titleW() === 0) return "stack";
		return cols() >= titleW() + MIN_ROW_COLS + 6 ? "split" : "stack";
	});

	const leftCols = createMemo(() =>
		Math.max(
			1,
			Math.min(
				Math.max(Math.floor(cols() / 3), titleW() + 3),
				cols() - MIN_ROW_COLS - 3,
			),
		),
	);

	return { mode, leftCols };
}
