import { onCleanup } from "solid-js";

/** Rows moved per arrow/vim keypress. */
const KEY_ROWS = 3;

/**
 * Wheel delta is scaled to `rh / 10` per unit, which is roughly 1.9x faster
 * than native scrolling, not slower: the name describes the divisor, not the
 * resulting feel.
 */
const DAMP = 1 / 10;

function isEditable(node: EventTarget | null): boolean {
	const el = node as HTMLElement | null;
	if (!el || typeof el.tagName !== "string") return false;
	return (
		el.isContentEditable ||
		el.tagName === "INPUT" ||
		el.tagName === "TEXTAREA" ||
		el.tagName === "SELECT"
	);
}

export interface ScrollControls {
	/** Current scroll offset in pixels, as the DOM reports it. */
	read: () => number;
}

/**
 * Damped wheel + keyboard scrolling over a real overflow container.
 *
 * Touch is deliberately untouched: touch scrolling never dispatches `wheel`, so
 * a wheel handler scopes the damping to devices that actually have wheels -- no
 * pointer-type or media-query sniffing needed, and a Bluetooth mouse on a
 * tablet still gets damped, which is correct.
 */
export function attachScroll(
	el: HTMLElement,
	rh: () => number,
	onScroll: (top: number) => void,
): ScrollControls {
	// Private float accumulator: sub-row motion collects here but never renders.
	let target = el.scrollTop;
	let queued = false;

	const maxScroll = () => {
		const row = rh() || 1;
		return Math.max(
			0,
			Math.round((el.scrollHeight - el.clientHeight) / row) * row,
		);
	};
	const clamp = (v: number) => Math.min(Math.max(v, 0), maxScroll());

	// The scrollTop value our own flush last wrote, as the browser stored it.
	let selfWrite = Number.NaN;

	const flush = () => {
		queued = false;
		const row = rh() || 1;
		// Assign wholesale rather than scrollBy(): scrollBy re-reads scrollTop,
		// which the compositor may already have rounded, losing the remainder.
		el.scrollTop = Math.floor(target / row) * row;
		selfWrite = el.scrollTop;
	};

	const schedule = () => {
		if (queued) return;
		queued = true;
		requestAnimationFrame(flush);
	};

	// Firefox on Windows/Linux reports DOM_DELTA_LINE with deltaY = 3, which is
	// 0.3 rows per notch -- Math.floor eats it and the page looks frozen unless
	// every mode is normalised to pixels first.
	const wheelPixels = (ev: WheelEvent): number => {
		switch (ev.deltaMode) {
			case 1:
				return ev.deltaY * (rh() || 1);
			case 2:
				return ev.deltaY * el.clientHeight;
			default:
				return ev.deltaY;
		}
	};

	const handleWheel = (ev: WheelEvent) => {
		if (ev.ctrlKey) return; // pinch-zoom; leave it to the browser
		ev.preventDefault();
		target = clamp(target + wheelPixels(ev) * (rh() || 1) * DAMP);
		schedule();
	};

	const handleKey = (ev: KeyboardEvent) => {
		if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
		if (isEditable(ev.target)) return;
		const step = KEY_ROWS * (rh() || 1);
		if (ev.key === "ArrowUp" || ev.key === "k")
			target = clamp(target - step);
		else if (ev.key === "ArrowDown" || ev.key === "j")
			target = clamp(target + step);
		else return;
		ev.preventDefault();
		schedule();
	};

	// Resync when scroll originated elsewhere: touch momentum, focus, Page keys.
	//
	// Never resync from a scroll our own flush caused. scrollTop is stored at
	// device-pixel precision, so a row height of 19.2px comes back as 58 rather
	// than 57.6, and adopting that into `target` bleeds a third of a row on
	// every keypress (3, 5.99, 8.02, 10.99 ... instead of 3, 6, 9, 12).
	let syncing = false;
	const handleScroll = () => {
		if (Math.abs(el.scrollTop - selfWrite) < 1) {
			selfWrite = Number.NaN;
		} else if (!queued) {
			target = el.scrollTop;
		}
		if (syncing) return;
		syncing = true;
		requestAnimationFrame(() => {
			syncing = false;
			onScroll(el.scrollTop);
		});
	};

	el.addEventListener("wheel", handleWheel, { passive: false });
	el.addEventListener("scroll", handleScroll, { passive: true });
	window.addEventListener("keydown", handleKey);

	onCleanup(() => {
		el.removeEventListener("wheel", handleWheel);
		el.removeEventListener("scroll", handleScroll);
		window.removeEventListener("keydown", handleKey);
	});

	return { read: () => el.scrollTop };
}
