import type { JSX } from "solid-js";
import { RAIL_ROWS } from "../lib/prose";

export interface RailProps {
	/** Border glyph. "X" for the same reason Box and Rule use it. */
	char?: string;
}

/**
 * A vertical strip of characters running the full height of whatever it is
 * placed in.
 *
 * The height is not knowable in JS -- a quote or a code block is as tall as
 * its content happened to wrap -- so the strip is drawn past any plausible
 * block height and clipped to the box. It clips *itself* rather than its
 * parent, so the prose beside it keeps its descenders.
 */
export function Rail(props: RailProps): JSX.Element {
	const char = () => props.char ?? "X";

	return (
		<pre class="rail" aria-hidden="true">
			{`${char()}\n`.repeat(RAIL_ROWS)}
		</pre>
	);
}
