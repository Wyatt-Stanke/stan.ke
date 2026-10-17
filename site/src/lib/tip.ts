import type { CellSize } from "./cell";
import type { Region } from "./layout";

/**
 * A one-row label laid over the content region: where a link goes, shown
 * under the character the pointer is on, or under the link's mark when the
 * link was reached from the keyboard.
 *
 * It is placed on `.app`'s own tracks rather than positioned in pixels, so its
 * box is whole cells by construction. The anchor's position is read once,
 * taken to the cell boundary nearest it, and everything after that is cell
 * arithmetic.
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

/** Null when the anchor is not on a row of the region: scrolled out of it. */
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

	// The cell boundary nearest the anchor's left edge, so the label starts
	// under it: exact for a character in a mono run, the nearest for one in
	// proportional prose. For a one-cell mark this is the cell holding its
	// centre. The label gives ground leftward when it would run off the region.
	const x = Math.round((anchor.left - origin.left) / cw);
	const col = Math.max(first, Math.min(x, last - cols));

	// The one-row band centred on the anchor. A mono glyph's box overhangs its
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

/**
 * Where a tip is anchored: an element, or a Range over one character. Both
 * are live, so a scroll re-measures the same character rather than a stale
 * rect.
 */
export interface TipAnchor {
	getBoundingClientRect(): DOMRect;
}

function caretAt(x: number, y: number): { node: Node; offset: number } | null {
	if (typeof document.caretPositionFromPoint === "function") {
		const p = document.caretPositionFromPoint(x, y);
		return p && { node: p.offsetNode, offset: p.offset };
	}
	// Older Safari has only the Range-shaped call.
	const r = document.caretRangeFromPoint(x, y);
	return r && { node: r.startContainer, offset: r.startOffset };
}

/**
 * The character of `within` under the point, as a one-character Range. Null
 * when the point is beside the text rather than on it: in the gap between a
 * row's columns, or just outside the link.
 *
 * A caret falls between characters, on whichever side of the hovered one is
 * nearer, so the character is the one just after the caret or just before it.
 * At either end of a text node the caret can land on the near side of the
 * boundary, so the neighbouring text node is tried too.
 */
export function charAt(within: Node, x: number, y: number): Range | null {
	const caret = caretAt(x, y);
	if (!(caret?.node instanceof Text) || !within.contains(caret.node)) {
		return null;
	}

	const range = document.createRange();
	const hit = (node: Text, i: number): boolean => {
		if (i < 0 || i >= node.length) return false;
		range.setStart(node, i);
		range.setEnd(node, i + 1);
		const r = range.getBoundingClientRect();
		return x >= r.left && x < r.right;
	};

	const { node, offset } = caret;
	if (hit(node, offset) || hit(node, offset - 1)) return range;

	const walk = document.createTreeWalker(within, NodeFilter.SHOW_TEXT);
	const near = (step: () => Node | null): Text | null => {
		walk.currentNode = node;
		let t = step() as Text | null;
		while (t && t.length === 0) t = step() as Text | null;
		return t;
	};
	const next = offset === node.length ? near(() => walk.nextNode()) : null;
	if (next && hit(next, 0)) return range;
	const prev = offset === 0 ? near(() => walk.previousNode()) : null;
	if (prev && hit(prev, prev.length - 1)) return range;
	return null;
}
