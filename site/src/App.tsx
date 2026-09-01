import type { JSX } from "solid-js";
import { createMemo, createSignal, Match, Show, Switch } from "solid-js";
import { CharScrollbar } from "./components/CharScrollbar";
import { Header } from "./components/Header";
import { LeftPane } from "./components/LeftPane";
import { PostList } from "./components/PostList";
import { posts } from "./data/posts";
import { createGrid, fitVars } from "./lib/cell";
import { figSize, render } from "./lib/figlet";
import { createLayout, layoutVars } from "./lib/layout";
import { buildGroups, fitRow, totalRows } from "./lib/rows";

const TITLE_LINES = "Wyatt\nStanke";
const TITLE = TITLE_LINES.replace("\n", " ");

// Rendered once at module load: figlet.textSync is synchronous, so nothing
// awaits before first paint.
const titleArt = render(TITLE_LINES);
const groups = buildGroups(posts);

// Both footprints of the same string: 35x8 as art, 6x2 as text. pickLayout
// takes the richest that fits the width it has.
const TITLE_SIZE = { art: figSize(titleArt), text: figSize(TITLE_LINES) };
const TOTAL_ROWS = totalRows(groups);

export function App(): JSX.Element {
	let root!: HTMLDivElement;

	const grid = createGrid(() => root);

	// One pass from (cols, rows) to every number anyone downstream needs.
	const layout = createLayout(grid.cols, grid.rows, () => TITLE_SIZE);

	// Every row is the same width, so the fit is computed once, not per row.
	const fit = createMemo(() => fitRow(layout().content.innerCols));

	// Read-only mirror of the DOM's scroll position, in pixels. Never written
	// back to the element: that closes a DOM -> signal -> DOM loop which
	// oscillates during touch momentum.
	const [scrollTop, setScrollTop] = createSignal(0);
	const scrollRows = () => scrollTop() / (grid.cell().rh || 1);

	const style = createMemo(() => ({
		...layoutVars(layout(), grid.cols(), grid.rows()),
		...fitVars(grid.cell()),
	}));

	return (
		<div ref={root} class="app-root">
			<Show when={grid.fontsReady() && grid.cell().cw > 0}>
				<main
					class="app"
					data-mode={layout().mode}
					data-chrome={layout().chrome}
					style={style()}
					data-grid-debug={
						new URLSearchParams(location.search).has("grid")
							? ""
							: undefined
					}
				>
					<Show when={layout().pane}>
						{(pane) => (
							<div class="app__chrome">
								<Switch>
									<Match when={layout().chrome === "pane"}>
										<LeftPane
											cols={pane().innerCols}
											rows={pane().innerRows}
											art={titleArt}
											text={TITLE_LINES}
										/>
									</Match>
									<Match when={layout().chrome === "plain"}>
										<LeftPane
											cols={pane().innerCols}
											rows={pane().innerRows}
											art={null}
											text={TITLE_LINES}
										/>
									</Match>
									<Match when={layout().chrome === "header"}>
										<Header
											cols={pane().innerCols}
											title={TITLE}
											rules
										/>
									</Match>
									<Match when={layout().chrome === "title"}>
										<Header
											cols={pane().innerCols}
											title={TITLE}
										/>
									</Match>
								</Switch>
							</div>
						)}
					</Show>

					<div class="app__content">
						<PostList
							groups={groups}
							fit={fit()}
							cols={layout().content.innerCols}
							rows={layout().content.innerRows}
							rh={() => grid.cell().rh}
							onScroll={setScrollTop}
						/>
					</div>

					<CharScrollbar
						count={layout().bar.rows}
						scroll={scrollRows()}
						total={TOTAL_ROWS}
					/>
				</main>
			</Show>
		</div>
	);
}
