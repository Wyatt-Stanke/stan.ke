import type { JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { figSize } from "../lib/figlet";
import { cellVars } from "./Cell";

export interface FigTextProps {
	/** Pre-rendered figlet art. */
	art: string;
	/** The real, readable string the art depicts. */
	text: string;
	as?: "h1" | "h2" | "div";
	class?: string;
}

/**
 * Figlet art sized to its exact cell footprint, with the real text carried
 * alongside for assistive tech.
 */
export function FigText(props: FigTextProps): JSX.Element {
	const size = () => figSize(props.art);

	return (
		<Dynamic
			component={props.as ?? "div"}
			class={`cell fig ${props.class ?? ""}`}
			style={cellVars(size().cols, size().rows)}
		>
			<span class="sr-only">{props.text}</span>
			<pre class="fig__art" aria-hidden="true">
				{props.art}
			</pre>
		</Dynamic>
	);
}
