import type { JSX } from "solid-js";
import {
	createContext,
	createMemo,
	createSignal,
	Match,
	Show,
	Switch,
	useContext,
} from "solid-js";
import { createGrid, type FittedCell, fitVars } from "../lib/cell";
import { figSize, render } from "../lib/figlet";
import { createLayout, layoutVars } from "../lib/layout";
import { typeface } from "../lib/typeface";
import { type BarState, CharScrollbar, FULL_BAR } from "./CharScrollbar";
import { Header } from "./Header";
import { LeftPane } from "./LeftPane";

const TITLE_LINES = "Wyatt\nStanke";
const TITLE = TITLE_LINES.replace("\n", " ");

// Rendered once at module load: figlet.textSync is synchronous, so nothing
// awaits before first paint.
const titleArt = render(TITLE_LINES);

// Both footprints of the same string: 35x8 as art, 6x2 as text. pickLayout
// takes the richest that fits the width it has.
const TITLE_SIZE = { art: figSize(titleArt), text: figSize(TITLE_LINES) };

/**
 * What the shell hands a page: the content region it has to fill, the fitted
 * cell it is measured in, and the one channel back out -- the scrollbar.
 *
 * The layout itself is deliberately not per-page. Every page's content region
 * is sized against the same demand, so navigating between the list and a post
 * can never shift the pane or the breakpoints under the reader.
 */
export interface ShellApi {
	/** Content region width, net of padding, in cells. */
	cols: () => number;
	/** Content region height, net of padding, in cells. */
	rows: () => number;
	cell: () => FittedCell;
	setBar: (state: BarState) => void;
}

const ShellContext = createContext<ShellApi>();

export function useShell(): ShellApi {
	const api = useContext(ShellContext);
	if (!api) throw new Error("useShell() called outside <Shell>");
	return api;
}

/**
 * The page chrome: title pane, content region, character scrollbar. Owns the
 * grid and the layout; the routed page owns whatever fills the content region.
 */
export function Shell(props: { children?: JSX.Element }): JSX.Element {
	let root!: HTMLDivElement;

	const grid = createGrid(() => root);

	// One pass from (cols, rows) to every number anyone downstream needs.
	const layout = createLayout(grid.cols, grid.rows, () => TITLE_SIZE);

	// The bar is written by whichever page is mounted and never read back, the
	// same one-way rule scroll position follows.
	const [bar, setBar] = createSignal<BarState>(FULL_BAR);

	const style = createMemo(() => ({
		...layoutVars(layout(), grid.cols(), grid.rows()),
		...fitVars(grid.cell()),
	}));

	const api: ShellApi = {
		cols: () => layout().content.innerCols,
		rows: () => layout().content.innerRows,
		cell: grid.cell,
		setBar,
	};

	return (
		<div ref={root} class="app-root">
			<Show when={grid.fontsReady() && grid.cell().cw > 0}>
				<main
					class="app"
					data-mode={layout().mode}
					data-chrome={layout().chrome}
					data-typeface={typeface()}
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
						<ShellContext.Provider value={api}>
							{props.children}
						</ShellContext.Provider>
					</div>

					<CharScrollbar count={layout().bar.rows} state={bar()} />
				</main>
			</Show>
		</div>
	);
}
