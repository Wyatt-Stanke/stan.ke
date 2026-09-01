import type { JSX } from "solid-js";
import { createMemo } from "solid-js";
import type { FigSize } from "./figlet";
import { MIN_LIST_ROWS, MIN_ROW_COLS } from "./rows";

export type LayoutMode = "split" | "slim" | "stack";

/*
 * ---------------------------------------------------------------------------
 * Page-chrome geometry.
 * ---------------------------------------------------------------------------
 *
 * lib/rows.ts owns the list's own geometry; everything here is the frame round
 * it, and no constant is stated in both places.
 *
 * Each number below is stated once and reaches CSS as a custom property. It
 * used to be stated three times in three notations -- as a literal in App.tsx's
 * contentCols(), as a padding in style.css, and as part of the magic +6 in the
 * split threshold -- and those three had drifted: split was chosen at
 * titleW + MIN_ROW_COLS + 6, one column short of the width its own regions
 * need, so the title track came out at MIN_TITLE_COLS - 1 at the breakpoint.
 * Deriving the threshold from the regions removes that class of bug.
 */

/** The character scrollbar column. */
export const BAR_COLS = 1;

/** Box draws its border on the perimeter; box__inner insets past it. */
export const BOX_PAD_COLS = 2;
export const BOX_BORDER_COLS = 1;
export const BOX_BORDER_ROWS = 2;

/** Chrome heights, richest first. */
export const HEADER_ROWS = 3;
export const TITLE_ROWS = 1;

export const SPLIT_PAD_START = 2;
export const SPLIT_PAD_END = 1;
export const STACK_PAD_START = 1;
/** Stack keeps a spare column so the duration never abuts the bar. */
export const STACK_PAD_END = 1;
/** One blank row between the chrome and the first year. */
export const STACK_PAD_TOP = 1;

/**
 * Where a thing sits on the cell grid, and how much of that span is padding.
 *
 * `.app` is one uniform grid of cols x rows cell tracks, so a region is just a
 * pair of line numbers and a pair of spans -- every grid line is a cell
 * boundary by construction, and the old per-mode grid-template-columns pairs
 * are gone.
 */
export interface Region {
	/** 1-based grid line the region starts on. */
	col: number;
	row: number;
	/** Track span, pad included. */
	cols: number;
	rows: number;
	padStart: number;
	padEnd: number;
	padTop: number;
	/** The span net of pad: what the child `.cell` is sized to. */
	innerCols: number;
	innerRows: number;
}

/** How the site title is drawn, richest first. */
export type ChromeKind = "pane" | "plain" | "header" | "title" | "none";

export interface Layout {
	mode: LayoutMode;
	chrome: ChromeKind;
	/** Null when there is no room for any chrome at all. */
	pane: Region | null;
	content: Region;
	bar: Region;
}

function region(
	col: number,
	row: number,
	cols: number,
	rows: number,
	pad: { start?: number; end?: number; top?: number } = {},
): Region {
	const padStart = pad.start ?? 0;
	const padEnd = pad.end ?? 0;
	const padTop = pad.top ?? 0;
	return {
		col,
		row,
		cols: Math.max(1, cols),
		rows: Math.max(1, rows),
		padStart,
		padEnd,
		padTop,
		innerCols: Math.max(1, cols - padStart - padEnd),
		innerRows: Math.max(1, rows - padTop),
	};
}

/**
 * The site name's two footprints, measured the same way off the same string.
 *
 * Which of them a mode draws is the *only* thing separating split from slim, so
 * both travel together and the builder picks one. Stating them as a pair here
 * also keeps the difference a matter of size rather than of kind: neither
 * builder knows what figlet is.
 */
export interface TitleSize {
	/** The name as figlet art. */
	art: FigSize;
	/** The same string, same line breaks, set in plain text. */
	text: FigSize;
}

type Builder = (cols: number, rows: number, title: TitleSize) => Layout | null;

/**
 * Wide: bordered title pane | list | bar.
 *
 * split and slim are the same three regions and the same X-bordered pane; they
 * differ in one number, the footprint that pane has to hold, so they are one
 * function with the title size as an argument rather than two near-copies.
 *
 * Returns null rather than squeezing. The pane's requirement and the list's
 * are both exact, so "does this fit" is a comparison of two derived numbers
 * and not a hand-written threshold -- which is what lets a second pane mode
 * cost one line instead of a new breakpoint constant.
 *
 * Both axes are checked. The width test is why a narrow viewport falls through
 * to the next mode; the height test is why a short landscape one does, rather
 * than rendering a title taller than the screen. MIN_LIST_ROWS is the floor in
 * that test because a pane mode must also leave a usable list: for split the
 * art's own 8 + 2 rows already exceeded it, but slim's 2-row title would
 * otherwise let it claim a viewport with no room for a year and one post.
 */
function buildPane(
	mode: LayoutMode,
	chrome: ChromeKind,
	title: FigSize,
	cols: number,
	rows: number,
): Layout | null {
	const need = title.cols + BOX_PAD_COLS + BOX_BORDER_COLS;
	const afford =
		cols - BAR_COLS - SPLIT_PAD_START - SPLIT_PAD_END - MIN_ROW_COLS;
	if (afford < need) return null;
	if (rows < Math.max(title.rows + BOX_BORDER_ROWS, MIN_LIST_ROWS)) {
		return null;
	}

	// A third of the width when there is room for it, never less than the art
	// needs, never more than the list can spare.
	const left = Math.min(Math.max(Math.floor(cols / 3), need), afford);
	const contentCols = cols - left - BAR_COLS;

	return {
		mode,
		chrome,
		pane: region(1, 1, left, rows),
		content: region(left + 1, 1, contentCols, rows, {
			start: SPLIT_PAD_START,
			end: SPLIT_PAD_END,
		}),
		bar: region(cols, 1, BAR_COLS, rows),
	};
}

/** Laptop and up: the name as figlet art. Needs 83 columns and 10 rows. */
const buildSplit: Builder = (cols, rows, title) =>
	buildPane("split", "pane", title.art, cols, rows);

/**
 * The band between a laptop and a phone: the pane kept, the art dropped.
 *
 * 35x8 of figlet needs 83 columns; the same two words in plain text need 54,
 * so this covers the ~30-column stretch that used to fall all the way to
 * stack -- a tablet in portrait, or a half-width desktop window, which has the
 * width for a side pane and only lacks it for the art.
 */
const buildSlim: Builder = (cols, rows, title) =>
	buildPane("slim", "plain", title.text, cols, rows);

/**
 * Narrow, and the terminal fallback: chrome across the top, list below.
 *
 * The chrome itself degrades on the height axis -- rule/title/rule, then a
 * bare title row, then nothing -- so a short viewport spends its rows on the
 * list rather than on furniture. The old stack header was a flat 3 rows plus a
 * blank one whatever the height was.
 */
function buildStack(cols: number, rows: number): Layout {
	const chrome: ChromeKind =
		rows >= HEADER_ROWS + STACK_PAD_TOP + MIN_LIST_ROWS
			? "header"
			: rows >= TITLE_ROWS + STACK_PAD_TOP + MIN_LIST_ROWS
				? "title"
				: "none";

	const chromeRows =
		chrome === "header" ? HEADER_ROWS : chrome === "title" ? TITLE_ROWS : 0;
	const below = rows - chromeRows;

	return {
		mode: "stack",
		chrome,
		pane: chromeRows > 0 ? region(1, 1, cols, chromeRows) : null,
		content: region(1, chromeRows + 1, cols - BAR_COLS, below, {
			start: STACK_PAD_START,
			end: STACK_PAD_END,
			top: chromeRows > 0 ? STACK_PAD_TOP : 0,
		}),
		bar: region(cols, chromeRows + 1, BAR_COLS, below),
	};
}

/**
 * Richest first. A mode declares its own minimum by failing to build, so the
 * breakpoint is a property of the geometry rather than a constant someone has
 * to keep in step with it -- and a new mode is one entry plus one builder,
 * not an edit in App.tsx, PostList, PostRow and two blocks of CSS.
 *
 * This still has to be JS, not a container query: `var()` is illegal in an
 * @container condition, the title term is runtime figlet output, and the modes
 * are different DOM, not different CSS.
 */
const MODES: readonly Builder[] = [buildSplit, buildSlim, buildStack];

export function pickLayout(
	cols: number,
	rows: number,
	title: TitleSize,
): Layout {
	for (const build of MODES) {
		const layout = build(cols, rows, title);
		if (layout) return layout;
	}
	return buildStack(cols, rows);
}

export function createLayout(
	cols: () => number,
	rows: () => number,
	title: () => TitleSize,
): () => Layout {
	return createMemo(() => pickLayout(cols(), rows(), title()));
}

function regionVars(name: string, r: Region | null): Record<string, string> {
	if (!r) return {};
	return {
		[`--${name}-col`]: String(r.col),
		[`--${name}-row`]: String(r.row),
		[`--${name}-cols`]: String(r.cols),
		[`--${name}-rows`]: String(r.rows),
		[`--${name}-pad-start`]: String(r.padStart),
		[`--${name}-pad-end`]: String(r.padEnd),
		[`--${name}-pad-top`]: String(r.padTop),
	};
}

/** Everything style.css needs. One rule per region, no per-mode branches. */
export function layoutVars(
	layout: Layout,
	cols: number,
	rows: number,
): JSX.CSSProperties {
	return {
		"--cols": String(cols),
		"--rows": String(rows),
		...regionVars("pane", layout.pane),
		...regionVars("content", layout.content),
		...regionVars("bar", layout.bar),
	} as JSX.CSSProperties;
}
