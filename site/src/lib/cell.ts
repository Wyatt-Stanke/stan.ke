import type { JSX } from "solid-js";
import { batch, createMemo, createSignal, onCleanup, onMount } from "solid-js";

export interface CellSize {
	cw: number;
	rh: number;
}

/**
 * The cell the app actually draws on: the natural cell stretched so that
 * `cols * cw` and `rows * rh` are exactly the container box, instead of
 * leaving the sub-cell remainder -- up to `cw - 1`px -- as bare background at
 * the right and bottom edges.
 *
 * Widening the cell is not enough on its own: advance is font-derived, so a
 * `white-space: pre` run would walk off its tracks and arrive a whole cell
 * short at the right-hand edge. Two handles put it back, and both are needed.
 *
 * `fs` is the font size that carries the stretch, so the glyph grows with its
 * cell and figlet strokes still meet. Alone it is close but not exact: the
 * engine quantises advance, leaving a few thousandths of a px per glyph, which
 * measured up to 1.3px across a full row.
 *
 * `tracking` is `letter-spacing` taking up exactly that residue. Blink adds it
 * per glyph in float, so a run of `cols` characters sums to `cols * cw` -- a
 * measured 0.006px across a full row, which no choice of font size reaches.
 *
 * Nothing equivalent is needed vertically: line boxes stack at `line-height`,
 * which is `--rh` itself, so `rh` stretches on its own.
 *
 * The stretch is one cell shared out over every track, so the type is within
 * 1/cols of its natural size -- under 4% at any width the layout modes allow.
 */
export interface FittedCell extends CellSize {
	fs: number;
	tracking: number;
}

interface BaseCell extends CellSize {
	/** :root's own font size, in px. */
	fs: number;
}

function readLen(el: Element, name: string): number {
	const v = getComputedStyle(el).getPropertyValue(name).trim();
	return v.endsWith("px") ? Number.parseFloat(v) : Number.NaN;
}

/** An off-screen run of `n` characters in :root's font, at `fs` px. */
function probeRun(n: number, fs?: number): DOMRect {
	const style = getComputedStyle(document.documentElement);
	const probe = document.createElement("span");
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.whiteSpace = "pre";
	probe.style.font = style.font;
	probe.style.fontFamily = style.fontFamily;
	probe.style.fontSize = fs === undefined ? style.fontSize : `${fs}px`;
	probe.style.lineHeight = style.lineHeight;
	probe.style.letterSpacing = "normal";
	probe.textContent = "X".repeat(n);
	document.body.appendChild(probe);
	const rect = probe.getBoundingClientRect();
	probe.remove();
	return rect;
}

// Fallback for engines without @property (pre-Safari 16.4 / pre-Firefox 128).
// A 100-char run divided down cuts the relative error of the browser's own
// LayoutUnit quantisation (1/64px Blink, 1/60px Gecko) by 100x.
function probeCell(): CellSize {
	const rect = probeRun(100);
	return { cw: rect.width / 100, rh: rect.height };
}

/**
 * The advance the engine actually gives a glyph at `fs`, which is the natural
 * advance quantised -- the whole reason `tracking` exists. A run is a plain sum
 * of advances, so dividing one back down recovers the quantised value exactly.
 */
function measureAdvance(fs: number): number {
	return probeRun(200, fs).width / 200;
}

/**
 * The unstretched cell, read off `:root`. The fit is applied further down the
 * tree, on `.app`, precisely so that this measurement stays independent of it:
 * measuring the stretched cell and re-fitting from that is a feedback loop that
 * can shed a column per resize.
 */
export function measureCell(): BaseCell {
	const root = document.documentElement;
	const fs = Number.parseFloat(getComputedStyle(root).fontSize) || 0;
	const cw = readLen(root, "--cw");
	const rh = readLen(root, "--rh");
	if (cw > 0 && rh > 0) return { cw, rh, fs };
	return { ...probeCell(), fs };
}

/**
 * Owns the character-grid dimensions. Observes the element rather than
 * `window`, so zoom and font-size changes are picked up too; a `resize`
 * listener misses both.
 */
export function createGrid(target: () => HTMLElement | undefined) {
	const [natural, setNatural] = createSignal<BaseCell>({
		cw: 0,
		rh: 0,
		fs: 0,
	});
	const [box, setBox] = createSignal({ w: 0, h: 0 });
	const [fontsReady, setFontsReady] = createSignal(false);

	const refresh = () => {
		const el = target();
		if (!el) return;
		const r = el.getBoundingClientRect();
		batch(() => {
			setNatural(measureCell());
			setBox({ w: r.width, h: r.height });
		});
	};

	onMount(() => {
		const el = target();
		if (!el) return;

		const ro = new ResizeObserver(refresh);
		ro.observe(el);

		const onFonts = () => {
			setFontsReady(true);
			refresh();
		};
		// Solid mounts synchronously, before the webfont has loaded, so the
		// first measurement is of the fallback -- re-measure once the real
		// metrics are available.
		document.fonts.load('1rem "Libertinus Mono"').catch(() => {});
		document.fonts.ready.then(onFonts).catch(() => setFontsReady(true));
		document.fonts.addEventListener("loadingdone", refresh);

		refresh();

		onCleanup(() => {
			ro.disconnect();
			document.fonts.removeEventListener("loadingdone", refresh);
		});
	});

	// Counted off the natural cell, never the fitted one: the fit is defined as
	// the stretch that makes this count exact, so feeding it back in would let
	// a hair of rounding drop a column.
	const cols = createMemo(() =>
		Math.max(1, Math.floor(box().w / (natural().cw || 1))),
	);
	const rows = createMemo(() =>
		Math.max(1, Math.floor(box().h / (natural().rh || 1))),
	);

	const cell = createMemo<FittedCell>(() => {
		const base = natural();
		const { w, h } = box();
		if (!(base.cw > 0 && base.rh > 0 && w > 0 && h > 0))
			return { ...base, tracking: 0 };
		const cw = w / cols();
		const fs = (base.fs * cw) / base.cw;
		return { cw, rh: h / rows(), fs, tracking: cw - measureAdvance(fs) };
	});

	return { cell, cols, rows, fontsReady, refresh };
}

/**
 * The fit as CSS. Set on `.app`, which is where `--cw`/`--rh` stop being `1ch`
 * and `1em` and become the stretched lengths everything below inherits.
 */
export function fitVars(cell: FittedCell): JSX.CSSProperties {
	return {
		"--cw": `${cell.cw}px`,
		"--rh": `${cell.rh}px`,
		// Absolute px, not a multiple of --cell-height: that property is
		// unregistered, so referring to it here substitutes its tokens and
		// re-resolves its rem terms against :root's font-size instead of the
		// initial 16px -- a 20% type size error, not a rounding one.
		"font-size": `${cell.fs}px`,
		"letter-spacing": `${cell.tracking}px`,
	};
}
