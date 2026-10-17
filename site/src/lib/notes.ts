import { SIDENOTE_STACK_GAP } from "./prose";

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

/** Slack for the float error in a height that is a whole number of rows. */
const EPS = 0.05;

/**
 * Hangs each margin note beside the row its marker is on, pushed down to clear
 * the note above when two would collide.
 *
 * Positions are worked in rows from the top of `root`, which sits on a row
 * boundary, so every note starts on one; and a note's own lines are rows, so
 * the next one down does too. The pixel conversion at the end is only there
 * because a note's containing block is whatever positioned box it happens to
 * be in -- a quote, a code block's wrapper -- and not always `root` itself.
 *
 * Every read happens before any write: nothing read here depends on where a
 * note is put, so that is one layout pass however many notes there are.
 */
export function placeNotes(root: HTMLElement, left: number, rh: number): void {
	const notes = root.querySelectorAll<HTMLElement>(
		'.prose__note[data-place="margin"]',
	);
	if (notes.length === 0 || !(rh > 0)) return;

	const origin = root.getBoundingClientRect();
	const reads = Array.from(notes, (note) => {
		const mark = (
			note.previousElementSibling ?? note
		).getBoundingClientRect();
		const box = (note.offsetParent ?? root).getBoundingClientRect();
		return {
			note,
			centre: (mark.top + mark.bottom) / 2 - origin.top,
			rows: Math.max(
				1,
				Math.ceil(note.getBoundingClientRect().height / rh - EPS),
			),
			dx: origin.left - box.left,
			dy: origin.top - box.top,
		};
	});

	let floor = 0;
	for (const r of reads) {
		const row = Math.max(Math.floor(r.centre / rh), floor);
		r.note.style.top = `${row * rh + r.dy}px`;
		r.note.style.left = `${left + r.dx}px`;
		floor = row + r.rows + SIDENOTE_STACK_GAP;
	}
}
