import type { JSX } from "solid-js";
import { cellVars } from "./Cell";

export interface BoxProps {
	cols: number;
	rows: number;
	/** Border glyph. "X" is a deliberate part of the look, not a placeholder. */
	char?: string;
	children?: JSX.Element;
}

/**
 * A rectangle outlined in characters. Four absolutely-positioned strips rather
 * than CSS borders, so the charset stays swappable; top and bottom span the
 * full width, which gives them the corners.
 */
export function Box(props: BoxProps): JSX.Element {
	const char = () => props.char ?? "X";
	const horizontal = () => char().repeat(props.cols);
	const vertical = () =>
		Array.from({ length: props.rows }, () => char()).join("\n");

	return (
		<div class="cell box" style={cellVars(props.cols, props.rows)}>
			<pre class="box__edge box__top" aria-hidden="true">
				{horizontal()}
			</pre>
			<pre class="box__edge box__left" aria-hidden="true">
				{vertical()}
			</pre>
			<pre class="box__edge box__right" aria-hidden="true">
				{vertical()}
			</pre>
			<pre class="box__edge box__bottom" aria-hidden="true">
				{horizontal()}
			</pre>
			<div class="box__inner">{props.children}</div>
		</div>
	);
}
