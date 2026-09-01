import figlet from "figlet";
import graceful from "figlet/fonts/Graceful";

export const FONT = "Graceful";

figlet.parseFont(FONT, graceful);

export const FONT_HEIGHT = Number.parseInt(
	graceful.split("\n")[0].trim().split(/\s+/)[1],
	10,
);

export interface FigSize {
	cols: number;
	rows: number;
}

export function render(text: string): string {
	return figlet.textSync(text, { font: FONT });
}

/**
 * Intrinsic size straight from the string -- exact, synchronous, and free.
 * This is what titleWidth()/postTitleWidth() (main.ts:108-121) did.
 */
export function figSize(art: string): FigSize {
	const lines = art.split("\n");
	let cols = 0;
	for (const line of lines) if (line.length > cols) cols = line.length;
	return { cols, rows: lines.length };
}
