import type { Post } from "../data/posts";
import { FONT_HEIGHT, render } from "./figlet";
import { DURATION_COLS, LABEL_COLS, yearOf } from "./taxonomy";

/*
 * ---------------------------------------------------------------------------
 * Horizontal: the column metrics of one post row.
 * ---------------------------------------------------------------------------
 *
 * Every row is a fixed set of columns so the titles share a left edge. A
 * ragged title column is the first thing that reads as broken on a character
 * grid, and it is what an inline, natural-width label produces.
 *
 * These numbers are the single source of truth: PostRow hands them to CSS as
 * custom properties rather than CSS restating them, and createLayout() sizes
 * the split threshold from them.
 *
 *   split   mmm  ␣␣  † post␣␣  ␣␣  Title ...................  ␣␣   22m
 *   stack   mmm  ␣   †         ␣   Title ...
 */

export const MONTH_COLS = 3; // "aug"
export const GLYPH_COLS = 1;
export const META_COLS = DURATION_COLS;

/** Glyph, one space, then the label word padded out by the track itself. */
export const TAG_COLS = GLYPH_COLS + 1 + LABEL_COLS;

export const SPLIT_GAP = 2;
export const STACK_GAP = 1;

/** Everything in a split row that is not the title. */
export const SPLIT_FIXED_COLS =
	MONTH_COLS + TAG_COLS + META_COLS + 3 * SPLIT_GAP;

/** Stack drops the label word and the duration; colour and glyph carry on. */
export const STACK_FIXED_COLS = MONTH_COLS + GLYPH_COLS + 2 * STACK_GAP;

/** Below this a split row is all furniture and no title, so stack instead. */
export const MIN_TITLE_COLS = 20;
export const MIN_ROW_COLS = SPLIT_FIXED_COLS + MIN_TITLE_COLS;

/*
 * ---------------------------------------------------------------------------
 * Vertical: the row model.
 * ---------------------------------------------------------------------------
 *
 * Pitch is no longer a constant. A post is one row in both modes; the height
 * that varies is the per-year figlet header, so total height has to be summed
 * over groups rather than multiplied. App.tsx and CharScrollbar both read
 * totalRows(), and the numbers must agree with the margins in style.css or the
 * scrollbar drifts from the content.
 */

/** One row of air between a year's art and its first post. */
export const YEAR_GAP = 1;

/** Rows between the last post of a group and the next year's art. */
export const GROUP_GAP = 2;

export const POST_ROWS = 1;

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
	return rows + GROUP_GAP * Math.max(0, groups.length - 1);
}
