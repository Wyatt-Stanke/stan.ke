import { batch, createMemo, createSignal, onCleanup, onMount } from "solid-js";

export interface CellSize {
	cw: number;
	rh: number;
}

function readLen(el: Element, name: string): number {
	const v = getComputedStyle(el).getPropertyValue(name).trim();
	return v.endsWith("px") ? Number.parseFloat(v) : Number.NaN;
}

// Fallback for engines without @property (pre-Safari 16.4 / pre-Firefox 128).
// Measures a 100-char run and divides: that cuts the relative error of the
// browser's own LayoutUnit quantisation (1/64px Blink, 1/60px Gecko) by 100x.
function probeCell(): CellSize {
	const root = document.documentElement;
	const style = getComputedStyle(root);
	const probe = document.createElement("span");
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.whiteSpace = "pre";
	probe.style.font = style.font;
	probe.style.fontFamily = style.fontFamily;
	probe.style.fontSize = style.fontSize;
	probe.style.lineHeight = style.lineHeight;
	probe.style.letterSpacing = style.letterSpacing;
	probe.textContent = "X".repeat(100);
	document.body.appendChild(probe);
	const rect = probe.getBoundingClientRect();
	probe.remove();
	return { cw: rect.width / 100, rh: rect.height };
}

export function measureCell(): CellSize {
	const root = document.documentElement;
	const cw = readLen(root, "--cw");
	const rh = readLen(root, "--rh");
	if (cw > 0 && rh > 0) return { cw, rh };
	return probeCell();
}

/**
 * Owns the character-grid dimensions. Observes the element rather than
 * `window`, so zoom and font-size changes are picked up too; a `resize`
 * listener misses both.
 */
export function createGrid(target: () => HTMLElement | undefined) {
	const [cell, setCell] = createSignal<CellSize>({ cw: 0, rh: 0 });
	const [box, setBox] = createSignal({ w: 0, h: 0 });
	const [fontsReady, setFontsReady] = createSignal(false);

	const refresh = () => {
		const el = target();
		if (!el) return;
		const r = el.getBoundingClientRect();
		batch(() => {
			setCell(measureCell());
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

	const cols = createMemo(() =>
		Math.max(1, Math.floor(box().w / (cell().cw || 1))),
	);
	const rows = createMemo(() =>
		Math.max(1, Math.floor(box().h / (cell().rh || 1))),
	);

	return { cell, cols, rows, fontsReady, refresh };
}
