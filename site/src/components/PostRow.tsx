import type { JSX } from "solid-js";
import { Show } from "solid-js";
import type { Post } from "../data/posts";
import type { LayoutMode } from "../lib/layout";
import {
	GLYPH_COLS,
	META_COLS,
	MONTH_COLS,
	POST_ROWS,
	SPLIT_GAP,
	STACK_GAP,
	TAG_COLS,
} from "../lib/rows";
import { formatDuration, KINDS, monthLabel } from "../lib/taxonomy";
import { cellVars } from "./Cell";

export interface PostRowProps {
	post: Post;
	mode: LayoutMode;
	/** Row width in cells. */
	cols: number;
}

/**
 * One post, one row. The old 10-row block (figlet title + dek) is gone: the
 * list is an index now, so a screenful is thirty entries rather than three.
 *
 * Information order is month, tag, title, duration. The tag carries the
 * taxonomy twice on purpose -- colour for medium, glyph for subtype, and the
 * word spelling out both. That redundancy is the accessibility floor and the
 * narrow-mode degradation path: stack drops the *word* first, so the two
 * pre-attentive cues are what survive.
 *
 * The columns are grid tracks, not summed calc() offsets, so every row's title
 * shares one left edge from a single track-sizing pass -- the same reason .app
 * is one grid rather than three positioned children.
 */
export function PostRow(props: PostRowProps): JSX.Element {
	const spec = () => KINDS[props.post.kind];
	const split = () => props.mode === "split";

	return (
		<article
			class={`cell postrow postrow--${props.mode}`}
			style={{
				...cellVars(props.cols, POST_ROWS),
				"--month-cols": String(MONTH_COLS),
				"--tag-cols": String(split() ? TAG_COLS : GLYPH_COLS),
				"--meta-cols": String(META_COLS),
				"--gap-cols": String(split() ? SPLIT_GAP : STACK_GAP),
			}}
		>
			<time datetime={props.post.date}>
				{monthLabel(props.post.date)}
			</time>

			<span class="postrow__tag" data-medium={spec().medium}>
				{/* Own element so a missing glyph falls back inside exactly one
				    cell instead of shifting the label and title columns. */}
				<span class="glyph" aria-hidden="true">
					{spec().glyph}
				</span>
				<Show
					when={split()}
					fallback={<span class="sr-only">{spec().label}</span>}
				>
					{` ${spec().label}`}
				</Show>
			</span>

			<span class="postrow__title">{props.post.title}</span>

			<Show when={split()}>
				<span class="postrow__meta">
					{formatDuration(props.post.minutes)}
				</span>
			</Show>
		</article>
	);
}
