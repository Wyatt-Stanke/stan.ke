import figlet from "figlet";
import graceful from "figlet/fonts/Graceful";

export const FONT = "Graceful";

figlet.parseFont(FONT, graceful);

// The old engine read field index 2 of the FIGfont header, which is the
// *baseline*, not the height. For Graceful ("flf2a$ 4 4 8 0 ...") both are 4,
// so the value was right by coincidence. Index 1 is the height.
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
