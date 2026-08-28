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
 * A rectangle outlined in characters, replacing the inline perimeter loop of
 * drawLeftPane() (main.ts:203-209).
 *
 * Drawn as four absolutely-positioned strips rather than CSS borders, so the
 * charset stays swappable. Top and bottom span the full width, which gives the
 * corners to the horizontal strips -- exactly as the original loop did, since
 * the corner cell satisfied both conditions and was written as the border char.
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
