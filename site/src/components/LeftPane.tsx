import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { figSize } from "../lib/figlet";
import { Box } from "./Box";
import { cellVars } from "./Cell";
import { FigText } from "./FigText";

export interface LeftPaneProps {
	cols: number;
	rows: number;
	/** Pre-rendered figlet art, or null to set the name in plain text. */
	art: string | null;
	/** The name itself, line breaks and all. */
	text: string;
}

/**
 * The name at its own intrinsic footprint, so the box's inner origin still
 * lands on a cell boundary. figSize is just "max line length by line count" --
 * it measures a plain string as exactly as it measures art, which is what lets
 * lib/layout.ts treat the two panes as one geometry with two title sizes.
 *
 * No sr-only twin here, unlike FigText: this *is* the text.
 */
function PlainTitle(props: { text: string }): JSX.Element {
	const size = () => figSize(props.text);

	return (
		<h1 class="cell" style={cellVars(size().cols, size().rows)}>
			{props.text}
		</h1>
	);
}

/**
 * Left pane for the two pane modes: an X-bordered box with the name inside.
 *
 * split draws the name as figlet art; slim draws it as plain text, for the
 * widths that have room for a side pane but not for 35x8 of art. Nothing else
 * about the pane changes between them, which is why this is one component with
 * a nullable `art` rather than two that would drift.
 */
export function LeftPane(props: LeftPaneProps): JSX.Element {
	return (
		<Box cols={props.cols} rows={props.rows}>
			<Show when={props.art} fallback={<PlainTitle text={props.text} />}>
				{(art) => <FigText as="h1" art={art()} text={props.text} />}
			</Show>
		</Box>
	);
}
