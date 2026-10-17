import type { CellSize } from "./cell";
import type { Region } from "./layout";

/**
 * A one-row label laid over the content region: where a link goes, shown
 * beside the mark that was hovered.
 *
 * It is placed on `.app`'s own tracks rather than positioned in pixels, so its
 * box is whole cells by construction. The mark's position is read once, taken
 * to the cell it sits in, and everything after that is cell arithmetic.
 */
export interface TipBox {
	/** 1-based grid lines, as `grid-column` and `grid-row` take them. */
	col: number;
	row: number;
	cols: number;
	/** Padded to exactly `cols`, and cut short with an ellipsis if need be. */
	text: string;
}

/** Blank cells either side of the text, so the label reads as a block. */
export const TIP_PAD = 1;

/** Slack for the float error in a position that is a whole row in theory. */
const EPS = 0.05;

/** Null when the mark is not on a row of the region: scrolled out of it. */
export function placeTip(
	anchor: DOMRect,
	origin: DOMRect,
	cell: CellSize,
	region: Region,
	text: string,
): TipBox | null {
	const { cw, rh } = cell;
	// 0-based, end-exclusive cell ranges from here down.
	const first = region.col - 1;
	const last = first + region.cols;
	const top = region.row - 1;
	const bottom = top + region.rows;

	const room = Math.max(1, region.cols - 2 * TIP_PAD);
	const body = text.length <= room ? text : `${text.slice(0, room - 1)}…`;
	const cols = Math.min(body.length + 2 * TIP_PAD, region.cols);

	// The cell holding the centre of the mark: exact for a glyph in a mono run,
	// the nearest cell for one sitting in proportional prose. The label starts
	// there and gives ground leftward when it would run off the region.
	const x = Math.floor((anchor.left + anchor.width / 2 - origin.left) / cw);
	const col = Math.max(first, Math.min(x, last - cols));

	// The one-row band centred on the mark. A mono glyph's box overhangs its
	// row by the same amount top and bottom, so its centre is the row's centre
	// and the band *is* the row; in prose it is wherever the line put it, and
	// the label takes the first whole row clear of it.
	const mid = (anchor.top + anchor.bottom) / 2 - origin.top;
	if (mid < top * rh || mid >= bottom * rh) return null;
	const below = Math.ceil((mid + rh / 2) / rh - EPS);
	const above = Math.floor((mid - rh / 2) / rh + EPS) - 1;
	const row = below < bottom ? below : Math.max(above, top);

	const pad = " ".repeat(TIP_PAD);
	return {
		col: col + 1,
		row: row + 1,
		cols,
		text: `${pad}${body}${pad}`.slice(0, cols),
	};
}
