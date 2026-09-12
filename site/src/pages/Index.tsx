import type { JSX } from "solid-js";
import { createEffect, createMemo, createSignal } from "solid-js";
import { barState } from "../components/CharScrollbar";
import { PostList } from "../components/PostList";
import { useShell } from "../components/Shell";
import { posts } from "../data/posts";
import { entries } from "../lib/content";
import { buildGroups, fitRow, totalRows } from "../lib/rows";

// Published posts first, then the placeholders that are still exercising the
// layout. buildGroups sorts by date regardless, so the order here is only
// about which set is the real one.
const groups = buildGroups([...entries.map((e) => e.post), ...posts]);
const TOTAL_ROWS = totalRows(groups);

export function Index(): JSX.Element {
	const shell = useShell();

	// Every row is the same width, so the fit is computed once, not per row.
	const fit = createMemo(() => fitRow(shell.cols()));

	// Read-only mirror of the DOM's scroll position, in pixels. Never written
	// back to the element: that closes a DOM -> signal -> DOM loop which
	// oscillates during touch momentum.
	const [scrollTop, setScrollTop] = createSignal(0);

	// The list's height is exact -- totalRows() sums a model rather than
	// observing one -- so the bar is driven off that and not off the DOM.
	createEffect(() => {
		const rows = shell.rows();
		const scrolled = scrollTop() / (shell.cell().rh || 1);
		shell.setBar(barState(scrolled, Math.max(0, TOTAL_ROWS - rows), rows));
	});

	createEffect(() => {
		document.title = "Wyatt Stanke";
	});

	return (
		<PostList
			groups={groups}
			fit={fit()}
			cols={shell.cols()}
			rows={shell.rows()}
			rh={() => shell.cell().rh}
			onScroll={(view) => setScrollTop(view.top)}
		/>
	);
}
