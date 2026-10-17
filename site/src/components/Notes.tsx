import type { JSX } from "solid-js";
import { createContext, createSignal, Show, useContext } from "solid-js";
import { superscript } from "../lib/notes";

/**
 * What a footnote needs from the page it is on: whether there is a margin to
 * hang it in. The Reader owns the answer, because it is a function of the
 * measure and the content width and nothing a note can see from inside a
 * paragraph.
 */
export interface NotesApi {
	/** Margin width in cells; 0 when notes are set inline. */
	side: () => number;
}

export const NotesContext = createContext<NotesApi>({ side: () => 0 });

export interface FootnoteProps {
	/** The number GFM gave it, as a string of digits. */
	n: string;
	/** Unique per reference, so a note cited twice is two notes. */
	id: string;
	/** The definition, already rewritten to sit inside a paragraph. */
	children?: JSX.Element;
}

const activate = (ev: KeyboardEvent): boolean =>
	ev.key === "Enter" || ev.key === " ";

/**
 * One footnote, at the point it is cited. scripts/notes.ts puts it there at
 * build time, carrying the definition with it, so the note never has to be
 * fetched from the foot of the page.
 *
 * With a margin it hangs beside its line, always open -- lib/notes.ts places
 * it. Without one the marker becomes a toggle and the note opens directly
 * under the line it was tapped on, rather than somewhere the reader has to go
 * and come back from.
 *
 * The marker is a span with a button role, not a <button>: a button is an
 * atomic inline, so the line could break between a word and its marker and
 * start the next line with a lone superscript. A span is part of the word.
 */
export function Footnote(props: FootnoteProps): JSX.Element {
	const notes = useContext(NotesContext);
	const [open, setOpen] = createSignal(false);
	const margin = () => notes.side() > 0;
	const mark = () => superscript(props.n);
	const toggle = () => setOpen(!open());

	return (
		<>
			<Show
				when={!margin()}
				fallback={
					<span class="prose__fnref" aria-hidden="true">
						{mark()}
					</span>
				}
			>
				{/* biome-ignore lint/a11y/useSemanticElements: a <button> is an atomic inline; see above. */}
				<span
					class="prose__fnref"
					role="button"
					tabIndex={0}
					aria-label={`Note ${props.n}`}
					aria-expanded={open()}
					aria-controls={props.id}
					onClick={toggle}
					onKeyDown={(ev) => {
						if (!activate(ev)) return;
						ev.preventDefault();
						toggle();
					}}
				>
					{mark()}
				</span>
			</Show>
			<span
				id={props.id}
				class="prose__note"
				role="note"
				data-place={margin() ? "margin" : "inline"}
				hidden={!margin() && !open()}
				style={{ "--note-mark-cols": String(props.n.length + 1) }}
			>
				<span class="prose__note-mark" aria-hidden="true">
					{mark()}
				</span>
				<span class="prose__note-body">{props.children}</span>
			</span>
		</>
	);
}
