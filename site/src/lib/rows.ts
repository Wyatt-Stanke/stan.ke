import type { Post } from "../data/posts";
import { FONT_HEIGHT, render } from "./figlet";
import { DURATION_COLS, LABEL_COLS, yearOf } from "./taxonomy";

/*
 * ---------------------------------------------------------------------------
 * Horizontal: the column metrics of one post row.
 * ---------------------------------------------------------------------------
 *
 * Every row is a fixed set of columns so the titles share a left edge. A ragged
 * title column is the first thing that reads as broken on a character grid, and
 * it is what an inline, natural-width label produces.
 *
 * *Which* columns is a width question, not a mode question: fitRow() drops
 * features one at a time, in DROP_ORDER, until the title track clears
 * MIN_TITLE_COLS. The glyph and the title are deliberately not in that table --
 * colour and glyph are the two pre-attentive taxonomy cues (see
 * lib/taxonomy.ts) and the title is the content, so they are the floor.
 *
 * These numbers are the single source of truth: PostRow hands them to CSS as
 * custom properties and one generated track list, so style.css never restates
 * them, and lib/layout.ts derives the split breakpoint from MIN_ROW_COLS.
 *
 *   full     mmm  __  T post__  __  Title ...................  __   22m
 *   -label   mmm  _   T         _   Title ..................   _    22m
 *   -meta    mmm  _   T         _   Title ......................
 *   -month   T    _   Title ...........................
 */

export const MONTH_COLS = 3; // "aug"
export const GLYPH_COLS = 1;
export const META_COLS = DURATION_COLS;

/** Glyph, one space, then the label word padded out by the tag track itself. */
export const TAG_COLS = GLYPH_COLS + 1 + LABEL_COLS;

/** Gutter between tracks: roomy while the label word is there, tight after. */
export const WIDE_GAP = 2;
export const TIGHT_GAP = 1;

/** Below this a row is all furniture and no title. */
export const MIN_TITLE_COLS = 20;

export type RowFeature = "month" | "label" | "meta";

/**
 * Cheapest to lose first. The label word goes before the duration because the
 * colour and the glyph already say what it says; the month goes last because
 * it is the only ordering cue inside a year group.
 */
const DROP_ORDER: readonly RowFeature[] = ["meta", "label", "month"];

const ALL_FEATURES: readonly RowFeature[] = ["month", "label", "meta"];

export interface RowFit {
	month: boolean;
	label: boolean;
	meta: boolean;
	/** Tag track width: the glyph, plus the word and its space when shown. */
	tagCols: number;
	/** Gutter between tracks, in cells. */
	gap: number;
	/** Everything that is not the title track, gutters included. */
	fixedCols: number;
}

const tagColsFor = (label: boolean): number =>
	GLYPH_COLS + (label ? 1 + LABEL_COLS : 0);

/**
 * Width of every track but the title, plus the gutters between them. Tag and
 * title are always present, so the track count starts at two.
 */
function fixedColsFor(on: ReadonlySet<RowFeature>, gap: number): number {
	let cells = tagColsFor(on.has("label"));
	let tracks = 2;
	if (on.has("month")) {
		cells += MONTH_COLS;
		tracks++;
	}
	if (on.has("meta")) {
		cells += META_COLS;
		tracks++;
	}
	return cells + gap * (tracks - 1);
}

/**
 * The width at which a row can show everything -- the list's term in the split
 * breakpoint. Content-independent: no published title feeds into it.
 */
export const MIN_ROW_COLS =
	fixedColsFor(new Set(ALL_FEATURES), WIDE_GAP) + MIN_TITLE_COLS;

export function fitRow(cols: number): RowFit {
	const on = new Set<RowFeature>(ALL_FEATURES);
	let gap = WIDE_GAP;

	while (cols - fixedColsFor(on, gap) < MIN_TITLE_COLS) {
		const next = DROP_ORDER.find((f) => on.has(f));
		if (next === undefined) break;
		on.delete(next);
		// Once the word is gone the row is terse; tighten the gutters with it.
		if (next === "label") gap = TIGHT_GAP;
	}

	return {
		month: on.has("month"),
		label: on.has("label"),
		meta: on.has("meta"),
		tagCols: tagColsFor(on.has("label")),
		gap,
		fixedCols: fixedColsFor(on, gap),
	};
}

/**
 * The row's grid-template-columns, generated from the fit rather than restated
 * in CSS. A dropped feature has to lose its *track*, not just its text --
 * otherwise the title's left edge moves and the empty column stays.
 */
export function rowTracks(fit: RowFit): string {
	const tracks: string[] = [];
	if (fit.month) tracks.push(`calc(${MONTH_COLS} * var(--cw))`);
	tracks.push(`calc(${fit.tagCols} * var(--cw))`);
	tracks.push("1fr");
	if (fit.meta) tracks.push(`calc(${META_COLS} * var(--cw))`);
	return tracks.join(" ");
}

/*
 * ---------------------------------------------------------------------------
 * Vertical: the row model.
 * ---------------------------------------------------------------------------
 *
 * Pitch is not a constant. A post is one row whatever the layout; the height
 * that varies is the per-year figlet header, so total height has to be summed
 * over groups rather than multiplied. App.tsx and CharScrollbar both read
 * totalRows().
 *
 * The gaps below are stated here only. PostList pushes them to CSS as custom
 * properties, because the scrollbar is drawn from totalRows() and a margin
 * changed on one side alone shows up as the bar drifting off the content.
 */

/** One row of air between a year's art and its first post. */
export const YEAR_GAP = 1;

/** Rows between the last post of a group and the next year's art. */
export const GROUP_GAP = 1;

export const POST_ROWS = 1;

export const TAIL_ROWS = 1;

/** A year's art plus one entry under it: less than this and the list is furniture. */
export const MIN_LIST_ROWS = FONT_HEIGHT + YEAR_GAP + POST_ROWS;

export interface Group {
	year: number;
	/** Pre-rendered at module load, like every other figlet on the site. */
	art: string;
	posts: Post[];
}

/** Newest first, both between groups and inside them. */
export function buildGroups(source: Post[]): Group[] {
	const sorted = [...source].sort((a, b) => (a.date < b.date ? 1 : -1));
	const groups: Group[] = [];

	for (const post of sorted) {
		const year = yearOf(post.date);
		const last = groups.at(-1);
		if (last?.year === year) last.posts.push(post);
		else groups.push({ year, art: render(String(year)), posts: [post] });
	}

	return groups;
}

export const groupRows = (group: Group): number =>
	FONT_HEIGHT + YEAR_GAP + group.posts.length * POST_ROWS;

export function totalRows(groups: Group[]): number {
	let rows = 0;
	for (const group of groups) rows += groupRows(group);
	return rows + GROUP_GAP * Math.max(0, groups.length - 1) + TAIL_ROWS;
}
