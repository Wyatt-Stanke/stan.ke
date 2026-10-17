import type { JSX } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import { destination } from "../lib/links";
import { charAt } from "../lib/tip";
import { useShell } from "./Shell";

/**
 * The ↗ after a link that leaves the site, and the tip that says where it
 * goes. The link answers for the mark: hovering any of it lays the
 * destination over the grid below the character under the pointer, and
 * follows the pointer along it; focusing it from the keyboard lays it below
 * the mark, where it goes back to when the pointer leaves.
 *
 * U+2197 is in Libertinus Mono, so in a mono run this is one more cell of the
 * same face. It is pinned to that face in prose too: Roboto has no arrows, and
 * a fallback face would draw one at its own advance.
 *
 * Plain inline text, not inline-block, so the line cannot break between the
 * link and its arrow and leave the arrow alone at the start of the next line.
 */
export function ExternalMark(props: { url: URL }): JSX.Element {
	const shell = useShell();
	let el!: HTMLSpanElement;

	onMount(() => {
		const link = el.closest("a") ?? el;
		const text = () => destination(props.url);
		const atMark = () => shell.showTip(link, text(), el);
		const hide = () => shell.hideTip(link);

		// Off a glyph -- a row's gap, the edge of the link -- the tip stays on
		// the last character it was under, or starts at the mark.
		const follow = (e: PointerEvent) => {
			const ch = charAt(link, e.clientX, e.clientY);
			if (ch) shell.showTip(link, text(), ch);
			else if (e.type === "pointerenter") atMark();
		};
		// A click focuses the link under a pointer that has already placed
		// the tip, and leaving a link that still has keyboard focus hands it
		// back to the mark.
		const focus = () => {
			if (!link.matches(":hover")) atMark();
		};
		const blur = () => {
			if (!link.matches(":hover")) hide();
		};
		const leave = () => {
			if (link.matches(":focus-visible")) atMark();
			else hide();
		};

		const off = new AbortController();
		const opts = { signal: off.signal };
		link.addEventListener("pointerenter", follow, opts);
		link.addEventListener("pointermove", follow, opts);
		link.addEventListener("pointerleave", leave, opts);
		link.addEventListener("focus", focus, opts);
		link.addEventListener("blur", blur, opts);
		onCleanup(() => {
			off.abort();
			hide();
		});
	});

	return (
		<>
			<span ref={el} class="ext" aria-hidden="true">
				↗
			</span>
			<span class="sr-only"> (opens in a new tab)</span>
		</>
	);
}
