import type { JSX } from "solid-js";
import { createSignal } from "solid-js";
import { measureCols } from "../../lib/prose";
import { useShell } from "../Shell";

const MIN_WIDTH = 200;
const MAX_WIDTH = 1600;

/** The label track and the gutter beside it, which the formula does not get. */
const KEY_COLS = 6;
const GAP_COLS = 2;

export interface GridProbeProps {
	/**
	 * What a reader gets instead of the widget.
	 *
	 * Required on every interactive component in a post: scripts/content.ts
	 * splices this into the .md, and a component without one degrades to its
	 * own tag name there. It is also the figure's caption, so assistive tech
	 * gets the same sentence.
	 */
	alt: string;
}

/**
 * The column count, live: drag a viewport width and watch createGrid()'s
 * floor() land on it.
 *
 * Deliberately reads the real fitted cell off the shell rather than a number
 * of its own, so what it shows is the page it is sitting on.
 */
export function GridProbe(props: GridProbeProps): JSX.Element {
	const shell = useShell();
	const [width, setWidth] = createSignal(980);

	const cw = () => shell.cell().cw || 1;
	const cols = () => Math.max(1, Math.floor(width() / cw()));

	/*
	 * The formula, shortened to what is left of the measure.
	 *
	 * It cannot be allowed to wrap: the row is one cell tall, so a second line
	 * paints over the slider above it rather than pushing anything down. CSS
	 * pins `white-space: pre` for the same reason; this is what stops it
	 * needing to clip in the first place.
	 */
	const calc = () => {
		const room = measureCols(shell.cols()) - KEY_COLS - GAP_COLS;
		const full = `floor(${width()} / ${cw().toFixed(2)}) = ${cols()}`;
		if (full.length <= room) return full;
		const short = `${width()} / ${cw().toFixed(2)} = ${cols()}`;
		return short.length <= room ? short : String(cols());
	};

	// The strip is capped to the measure so it can never widen the article,
	// and says so when it is: drawing 68 characters under the number 79 with
	// nothing to mark the cut is the one way this could lie.
	const bar = () => {
		const room = measureCols(shell.cols());
		return cols() <= room
			? "X".repeat(cols())
			: `${"X".repeat(Math.max(0, room - 1))}…`;
	};

	return (
		<figure class="demo">
			<figcaption class="sr-only">{props.alt}</figcaption>

			<label class="demo__row">
				<span class="demo__key">width</span>
				<input
					class="demo__range"
					type="range"
					min={MIN_WIDTH}
					max={MAX_WIDTH}
					step="1"
					value={width()}
					onInput={(ev) => setWidth(ev.currentTarget.valueAsNumber)}
				/>
				<span class="demo__value">{`${width()}px`}</span>
			</label>

			<p class="demo__row demo__calc">
				<span class="demo__key">cols</span>
				<span>{calc()}</span>
			</p>

			<pre class="demo__bar" aria-hidden="true">
				{bar()}
			</pre>
		</figure>
	);
}
