import type { JSX } from "solid-js";
import { Box } from "./Box";
import { FigText } from "./FigText";

export interface LeftPaneProps {
	cols: number;
	rows: number;
	art: string;
	text: string;
}

/** Split-mode left pane: an X-bordered box with the figlet title inside. */
export function LeftPane(props: LeftPaneProps): JSX.Element {
	return (
		<Box cols={props.cols} rows={props.rows}>
			<FigText as="h1" art={props.art} text={props.text} />
		</Box>
	);
}
