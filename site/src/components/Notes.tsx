import type { JSX } from "solid-js";
import {
	createContext,
	createSignal,
	onCleanup,
	Show,
	useContext,
} from "solid-js";
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
	/** Digits in the post's highest note number: the number track's width. */
	digits: string;
	/** "true" when cited straight after another note, with nothing between. */
	joined: string;
	/** The definition, already rewritten to sit inside a paragraph. */
	children?: JSX.Element;
}

/**
 * How long a margin note stays open after the pointer leaves its marker. The
 * note is across the measure from the marker, and this is the time the
 * pointer has to get there; arriving keeps it open.
 */
const LINGER_MS = 100;

const activates = (ev: KeyboardEvent): boolean =>
	ev.key === "Enter" || ev.key === " ";

/**
 * One footnote, at the point it is cited. scripts/notes.ts puts it there at
 * build time, carrying the definition with it, so the note never has to be
 * fetched from the foot of the page.
 *
 * With a margin it hangs beside its line, placed by lib/notes.ts -- whole, cut
 * to its first line to make room for the next note, or, when the margin near
 * its line is already taken, left out. Opening it shows all of it over the margin at its
 * own line in inverse video, and inverts the marker with it, so either one
 * leads to the other. Hovering or focusing opens it while the pointer or focus
 * stays; a click or Enter pins it.
 *
 * Without a margin the marker is a toggle and the note opens directly under
 * the line it was tapped on, rather than somewhere the reader has to go and
 * come back from.
 *
 * The marker is a span with a button role, not a <button>: a button is an
 * atomic inline, so the line could break between a word and its marker and
 * start the next line with a lone superscript. A span is part of the word.
 */
export function Footnote(props: FootnoteProps): JSX.Element {
	const notes = useContext(NotesContext);
	const margin = () => notes.side() > 0;
	const mark = () => superscript(props.n);

	const [pinned, setPinned] = createSignal(false);
	// Pointer on the marker or the note, or focus on the marker. Only the
	// margin opens on this: inline, opening reflows the paragraph under the
	// pointer, which is not something to do on a hover.
	const [near, setNear] = createSignal(false);
	const open = () => pinned() || (margin() && near());

	let linger: ReturnType<typeof setTimeout> | undefined;
	const approach = () => {
		clearTimeout(linger);
		setNear(true);
	};
	const retreat = () => {
		clearTimeout(linger);
		linger = setTimeout(() => setNear(false), LINGER_MS);
	};
	const leave = () => {
		clearTimeout(linger);
		setNear(false);
	};
	onCleanup(() => clearTimeout(linger));

	return (
		<>
			{/* A raised comma, the cell face's nearest thing to a superscript
			    one: it sits at the digits' height where a comma would drop to
			    the baseline. */}
			<Show when={props.joined === "true"}>
				<span class="prose__fnsep" aria-hidden="true">
					’
				</span>
			</Show>
			{/* biome-ignore lint/a11y/useSemanticElements: a <button> is an atomic inline; see above. */}
			<span
				class="prose__fnref"
				role="button"
				tabIndex={0}
				aria-label={`Note ${props.n}`}
				aria-expanded={open()}
				aria-controls={props.id}
				onClick={() => setPinned(!pinned())}
				onKeyDown={(ev) => {
					if (ev.key === "Escape") {
						setPinned(false);
						leave();
					} else if (activates(ev)) {
						ev.preventDefault();
						setPinned(!pinned());
					}
				}}
				onPointerEnter={approach}
				onPointerLeave={retreat}
				onFocus={approach}
				onBlur={leave}
			>
				{mark()}
			</span>
			<span
				id={props.id}
				class="prose__note"
				role="note"
				data-place={margin() ? "margin" : "inline"}
				data-open={open() ? "" : undefined}
				hidden={!margin() && !open()}
				onPointerEnter={approach}
				onPointerLeave={retreat}
				style={{ "--note-mark-cols": String(Number(props.digits) + 1) }}
			>
				<span class="prose__note-mark" aria-hidden="true">
					{mark()}
				</span>
				<span class="prose__note-body">{props.children}</span>
			</span>
		</>
	);
}
