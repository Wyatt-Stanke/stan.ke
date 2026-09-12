import { createSignal } from "solid-js";

/**
 * Which face the body of a post is set in. `mono` is the site's own voice, one
 * text line per grid row; `prose` is the reading escape hatch -- Roboto with
 * real leading, which is the one place on the site that leaves the row grid.
 *
 * The choice never touches :root's font-size or font-family. Those are what
 * the whole cell model is measured from (see lib/cell.ts), so the swap is
 * scoped to the article body and the chrome around it stays on the grid.
 */
export type Typeface = "mono" | "prose";

const KEY = "typeface";

function stored(): Typeface {
	try {
		return localStorage.getItem(KEY) === "prose" ? "prose" : "mono";
	} catch {
		// Private mode and storage-blocking settings throw on access rather
		// than returning null.
		return "mono";
	}
}

const [typeface, set] = createSignal<Typeface>(stored());

export { typeface };

let requested = false;

/** Dynamic, so the default reading never downloads a face it will not use. */
function loadProseFont(): void {
	if (requested) return;
	requested = true;
	import("@fontsource-variable/roboto/wght.css");
	import("@fontsource-variable/roboto/wght-italic.css");
}

export function setTypeface(next: Typeface): void {
	if (next === "prose") loadProseFont();
	set(next);
	try {
		localStorage.setItem(KEY, next);
	} catch {}
}

export const toggleTypeface = (): void =>
	setTypeface(typeface() === "mono" ? "prose" : "mono");

if (typeface() === "prose") loadProseFont();
