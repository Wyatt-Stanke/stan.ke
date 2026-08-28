import type { JSX } from "solid-js";
import { createMemo, createSignal, Show } from "solid-js";
import { CharScrollbar } from "./components/CharScrollbar";
import { Header } from "./components/Header";
import { LeftPane } from "./components/LeftPane";
import { PostList } from "./components/PostList";
import { posts } from "./data/posts";
import { createGrid } from "./lib/cell";
import { figSize, render } from "./lib/figlet";
import { createLayout, HEADER_ROWS } from "./lib/layout";
import { buildGroups, totalRows } from "./lib/rows";

const TITLE = "Wyatt Stanke";

// Rendered once at module load. figlet.textSync removes the async boot dance
// (26 awaited renders) that used to block first paint in main.ts:96-106. There
// are only a handful of renders left now: the site title and one year per
// group, instead of one per post.
const titleArt = render("Wyatt\nStanke");
const groups = buildGroups(posts);

const TITLE_W = figSize(titleArt).cols;
const TOTAL_ROWS = totalRows(groups);

export function App(): JSX.Element {
	let root!: HTMLDivElement;

	const grid = createGrid(() => root);
	const { mode, leftCols } = createLayout(grid.cols, () => TITLE_W);

	// Read-only mirror of the DOM's scroll position, in pixels. Never written
	// back to the element -- that would close a DOM -> signal -> DOM loop that
	// oscillates during touch momentum.
	const [scrollTop, setScrollTop] = createSignal(0);
	const scrollRows = () => scrollTop() / (grid.cell().rh || 1);

	// Split: the list fills the full height; the bar spans every row.
	// Stack: the header takes 3 rows, then one blank row before the first year
	// (main.ts:318 passes paneTop + 1). The bar spans from the header down.
	const listRows = () =>
		mode() === "split"
			? grid.rows()
			: Math.max(1, grid.rows() - HEADER_ROWS - 1);
	const barRows = () =>
		mode() === "split"
			? grid.rows()
			: Math.max(1, grid.rows() - HEADER_ROWS);
	// Split: 1fr is cols - left - 1, less 2 cells of leading pad and 1 of
	// trailing pad. Stack: cols - 1, less 1 leading, leaving a spare column.
	const contentCols = () =>
		mode() === "split"
			? Math.max(1, grid.cols() - leftCols() - 4)
			: Math.max(1, grid.cols() - 3);

	const style = createMemo(() => ({
		"--cols": String(grid.cols()),
		"--rows": String(grid.rows()),
		"--left": String(leftCols()),
	}));

	return (
		<div ref={root} class="app-root">
			<Show when={grid.fontsReady() && grid.cell().cw > 0}>
				<main
					class={`app app--${mode()}`}
					style={style()}
					data-grid-debug={
						new URLSearchParams(location.search).has("grid")
							? ""
							: undefined
					}
				>
					<Show
						when={mode() === "split"}
						fallback={<Header cols={grid.cols()} title={TITLE} />}
					>
						<LeftPane
							cols={leftCols()}
							rows={grid.rows()}
							art={titleArt}
							text={TITLE}
						/>
					</Show>

					<div class="app__content">
						<PostList
							groups={groups}
							mode={mode()}
							cols={contentCols()}
							rows={listRows()}
							rh={() => grid.cell().rh}
							onScroll={setScrollTop}
						/>
					</div>

					<CharScrollbar
						count={barRows()}
						scroll={scrollRows()}
						total={TOTAL_ROWS}
					/>
				</main>
			</Show>
		</div>
	);
}
