import type { JSX } from "solid-js";
import { Show } from "solid-js";
import type { Post } from "../data/posts";
import type { RowFit } from "../lib/rows";
import { POST_ROWS, rowTracks } from "../lib/rows";
import { formatDuration, KINDS, monthLabel } from "../lib/taxonomy";
import { cellVars } from "./Cell";

export interface PostRowProps {
	post: Post;
	/** Which columns survive at this width, from fitRow(). */
	fit: RowFit;
	/** Row width in cells. */
	cols: number;
}

/**
 * One post, one row: month, tag, title, duration.
 *
 * The tag carries the taxonomy twice on purpose -- colour for medium, glyph for
 * subtype, and the word spelling out both. That redundancy is the accessibility
 * floor and the narrow-mode degradation path: the *word* is the first thing
 * fitRow() drops, so the two pre-attentive cues survive.
 *
 * The row takes a RowFit, never a LayoutMode, and renders the columns that fit.
 * A dropped column keeps its text as .sr-only -- out of flow, so it claims no
 * track and the row stays whole for a screen reader at every width.
 *
 * The columns are grid tracks, not summed calc() offsets, so every row's title
 * shares one left edge from a single track-sizing pass.
 */
export function PostRow(props: PostRowProps): JSX.Element {
	const spec = () => KINDS[props.post.kind];

	return (
		<article
			class="cell postrow"
			style={{
				...cellVars(props.cols, POST_ROWS),
				"--gap-cols": String(props.fit.gap),
				"grid-template-columns": rowTracks(props.fit),
			}}
		>
			<time
				class={props.fit.month ? undefined : "sr-only"}
				datetime={props.post.date}
			>
				{monthLabel(props.post.date)}
			</time>

			<span class="postrow__tag" data-medium={spec().medium}>
				{/* Own element so a missing glyph falls back inside exactly one
				    cell instead of shifting the label and title columns. */}
				<span class="glyph" aria-hidden="true">
					{spec().glyph}
				</span>
				<Show
					when={props.fit.label}
					fallback={<span class="sr-only">{spec().label}</span>}
				>
					{` ${spec().label}`}
				</Show>
			</span>

			<span class="postrow__title">{props.post.title}</span>

			<span class={props.fit.meta ? "postrow__meta" : "sr-only"}>
				{formatDuration(props.post.minutes)}
			</span>
		</article>
	);
}
