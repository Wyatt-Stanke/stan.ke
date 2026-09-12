/*
 * The article's metrics, owned here the way lib/rows.ts owns the list's.
 * components/mdx.tsx and the .prose rules in style.css read these through
 * custom properties rather than restating them.
 */

/**
 * Measure cap, in cells. The content region on a wide screen is far wider than
 * anything readable -- a monospaced line running the full width of a desktop
 * window is unreadable however exactly it lands on the grid -- so prose stops
 * well short of it.
 */
export const MEASURE_COLS = 68;

export const measureCols = (available: number): number =>
	Math.min(MEASURE_COLS, available);

/** Blank rows between two blocks. */
export const BLOCK_GAP = 1;

/** Extra air above a heading, on top of BLOCK_GAP. */
export const HEADING_LEAD = 1;

/** Air under the header rule, before the first block of the body. */
export const HEAD_GAP = 1;

/** Air under the last block, so the final line is not flush with the edge. */
export const TAIL_ROWS = 2;

/** Marker track widths: "- " and "99. ". */
export const BULLET_COLS = 2;
export const NUMBER_COLS = 4;

/**
 * How many rows a rail draws before it runs out. It is a column of characters
 * clipped to the block beside it, so this is only an upper bound on block
 * height, not a cost paid per block.
 */
export const RAIL_ROWS = 512;
