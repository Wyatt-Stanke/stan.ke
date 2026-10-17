import { SIDENOTE_MAX_DRIFT } from "./prose";

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/**
 * A note number as superscript *characters*, never as <sup>.
 *
 * <sup> raises the baseline and shrinks the face, and either one grows the
 * line box -- a row of text with a footnote in it would come out taller than
 * one without, and everything below it would leave the grid. Libertinus Mono
 * draws all ten superscript digits at the full 640-unit advance, so a marker
 * is exactly one cell per digit and the line it sits in never notices.
 */
export const superscript = (n: string): string =>
	n.replace(/\d/g, (d) => SUPERSCRIPT[Number(d)]);

/**
 * Slack for the float error in a length that is a whole number of rows. Kept
 * well under the fractions the proportional face really produces -- two lines
 * of it are 3.04 rows, which has to count as 4.
 */
const EPS = 0.01;

/** One margin note as the layout sees it, in rows from the top of the prose. */
export interface NoteSpec {
	/** The row its marker sits on. */
	want: number;
	/** Its full height. */
	rows: number;
}

/**
 * `full`: set whole. `clamped`: cut to its first line, to make room for the
 * next note. `deferred`: no room within reach of its marker, so not set at all
 * until it is opened.
 *
 * A cut is always to one line, never to "as many as fit". This font's rows
 * overlap in ink -- a descender reaches up to 0.11em past its row and the
 * next line's ascenders start right at the boundary, measured across the
 * site's sizes -- so no clip edge between two lines keeps the tails of one
 * without showing the tops of the other. A single unwrapped line has no line
 * after it to show.
 */
export type NoteFit = "full" | "clamped" | "deferred";

export interface NoteSlot {
	fit: NoteFit;
	/** Where it starts -- for a deferred note, where it opens. */
	row: number;
}

/**
 * Lays margin notes down the margin in order, none more than `maxDrift` rows
 * below its marker.
 *
 * Pushing each note down past the one above is the obvious rule, and it does
 * not survive a page that cites heavily: the push compounds, and a few dense
 * paragraphs in, the margin is a screen behind the text it annotates. So a note
 * is pushed only a little. One that would run into the next note's line is
 * cut to its first line instead, so the next can sit level with its own -- a
 * run of close citations comes out one line each, like an index -- and a note
 * that still cannot land within reach is left out of the margin and opens from
 * its marker (components/Notes.tsx).
 *
 * `perLine` is rows per line of note text: 1 in mono, so every result is
 * whole rows, and more than 1 in the proportional face.
 */
export function layoutNotes(
	specs: readonly NoteSpec[],
	perLine = 1,
	maxDrift = SIDENOTE_MAX_DRIFT,
): NoteSlot[] {
	const slots: NoteSlot[] = [];
	let free = 0;

	specs.forEach((spec, i) => {
		const row = Math.max(spec.want, free);
		if (row - spec.want > maxDrift) {
			slots.push({ fit: "deferred", row: spec.want });
			return;
		}

		// Whole if it ends before the next note wants to start.
		const room = i + 1 < specs.length ? specs[i + 1].want - row : Infinity;
		const fit = spec.rows <= room ? "full" : "clamped";
		slots.push({ fit, row });
		free = row + (fit === "full" ? spec.rows : Math.ceil(perLine - EPS));
	});

	return slots;
}

/**
 * Measures the margin notes under `root`, lays them out, and writes the result
 * back as each note's position and `data-fit`.
 *
 * Rows are counted from the top of `root`, which sits on a row boundary. The
 * pixel conversion at the end is only there because a note's containing block
 * is whatever positioned box it happens to be in -- a quote, a code block's
 * wrapper -- and not always `root` itself.
 *
 * The previous pass's cuts come off first, or a cut note would be measured
 * at its cut height. After that every read happens before any write, so it is
 * two layouts however many notes there are.
 */
export function placeNotes(root: HTMLElement, left: number, rh: number): void {
	const notes = Array.from(
		root.querySelectorAll<HTMLElement>('.prose__note[data-place="margin"]'),
	);
	if (notes.length === 0 || !(rh > 0)) return;

	for (const note of notes) note.removeAttribute("data-fit");

	const origin = root.getBoundingClientRect();
	const perLine =
		Number.parseFloat(getComputedStyle(notes[0]).lineHeight) / rh || 1;

	const reads = notes.map((note) => {
		const mark = (
			note.previousElementSibling ?? note
		).getBoundingClientRect();
		const box = (note.offsetParent ?? root).getBoundingClientRect();
		const height = note.getBoundingClientRect().height;
		return {
			spec: {
				want: Math.floor(
					((mark.top + mark.bottom) / 2 - origin.top) / rh,
				),
				rows: Math.max(1, Math.ceil(height / rh - EPS)),
			},
			dx: origin.left - box.left,
			dy: origin.top - box.top,
		};
	});

	const slots = layoutNotes(
		reads.map((r) => r.spec),
		perLine,
	);

	notes.forEach((note, i) => {
		const { fit, row } = slots[i];
		note.style.top = `${row * rh + reads[i].dy}px`;
		note.style.left = `${left + reads[i].dx}px`;
		note.dataset.fit = fit;
	});
}
