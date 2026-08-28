import type { JSX } from "solid-js";

/**
 * Footprint helper. A component declares two numbers and the `.cell` class
 * turns them into an exact box of `cols x rows` character cells.
 */
export function cellVars(cols: number, rows: number): JSX.CSSProperties {
	return {
		"--cols": String(cols),
		"--rows": String(rows),
	};
}
