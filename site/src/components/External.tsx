import type { JSX } from "solid-js";
import { onCleanup, onMount } from "solid-js";
import { destination } from "../lib/links";
import { useShell } from "./Shell";

/**
 * The ↗ after a link that leaves the site. Hovering it -- or focusing the link
 * it belongs to, which is the same question asked from a keyboard -- lays the
 * destination over the grid below it, through the shell's tip.
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

	const show = () => shell.showTip(el, destination(props.url));
	const hide = () => shell.hideTip(el);

	onMount(() => {
		const link = el.closest("a");
		if (!link) return;
		link.addEventListener("focus", show);
		link.addEventListener("blur", hide);
		onCleanup(() => {
			link.removeEventListener("focus", show);
			link.removeEventListener("blur", hide);
		});
	});
	onCleanup(hide);

	return (
		<>
			<span
				ref={el}
				class="ext"
				aria-hidden="true"
				onPointerEnter={show}
				onPointerLeave={hide}
			>
				↗
			</span>
			<span class="sr-only"> (opens in a new tab)</span>
		</>
	);
}
