/**
 * The post taxonomy: two orthogonal axes read off a single `kind`.
 *
 *   colour = medium   (what you do with it: read / watch / use)
 *   glyph  = subtype  (which flavour of that medium)
 *
 * The third medium is named "interactive" rather than "software" or "projects"
 * because it names the axis the other two already sit on -- writing is read,
 * video is watched, this is used. "Projects" would overlap writing (an essay is
 * a project too) and "software" is a fact about implementation, not about what
 * the reader is being handed.
 *
 * Every glyph here must be verified to exist in Libertinus Mono, and coverage
 * is the whole check: the font is fixed-pitch across all 614 glyphs, so
 * anything it covers is one cell wide automatically. Anything it does not falls
 * back to a font with its own metrics -- see .glyph in style.css.
 *
 * The charset is swappable on purpose, like Box/Rule's `char` prop.
 */

export type Medium = "writing" | "video" | "interactive";

export type Kind =
	| "post"
	| "essay"
	| "short"
	| "video"
	| "series"
	| "site"
	| "game"
	| "app";

export interface KindSpec {
	medium: Medium;
	/** Word shown in the label column. Also the screen-reader name. */
	label: string;
	glyph: string;
}

export const KINDS: Record<Kind, KindSpec> = {
	// Daggers: the typographic single/double pair, so "longer" is the same mark
	// doubled.
	post: { medium: "writing", label: "post", glyph: "†" },
	essay: { medium: "writing", label: "essay", glyph: "‡" },

	// One note, two notes, two notes double-beamed: ranked by ink, and "series"
	// landing on the plural glyph is the point.
	short: { medium: "video", label: "short", glyph: "♪" },
	video: { medium: "video", label: "video", glyph: "♫" },
	series: { medium: "video", label: "series", glyph: "♬" },

	// Unordered, so three distinct marks rather than a ranked family. A mark
	// needs enough ink to survive the smallest cell size -- U+2192 ARROW is a
	// single thin horizontal stroke and reads as a hyphen there.
	site: { medium: "interactive", label: "site", glyph: "§" },
	game: { medium: "interactive", label: "game", glyph: "★" },
	app: { medium: "interactive", label: "app", glyph: "¤" },
};

/** Width of the label column, derived so it can never drift from the table. */
export const LABEL_COLS = Math.max(
	...Object.values(KINDS).map((k) => k.label.length),
);

const MONTHS = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec",
];

/**
 * Dates are sliced, never parsed. `new Date("2026-08-03")` is UTC midnight,
 * which is the 2nd of August for anyone west of Greenwich -- and a January 1st
 * post would file itself under the previous year.
 */
export const yearOf = (date: string): number => Number(date.slice(0, 4));

export const monthLabel = (date: string): string =>
	MONTHS[Number(date.slice(5, 7)) - 1] ?? "";

/** Widest string formatDuration can return: "1h20". */
export const DURATION_COLS = 4;

export function formatDuration(minutes?: number): string {
	if (minutes == null) return "";
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
