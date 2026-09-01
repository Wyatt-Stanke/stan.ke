import type { JSX } from "solid-js";
import { For, onMount } from "solid-js";
import type { Group, RowFit } from "../lib/rows";
import { GROUP_GAP, TAIL_ROWS, YEAR_GAP } from "../lib/rows";
import { attachScroll } from "../lib/scroll";
import { cellVars } from "./Cell";
import { PostRow } from "./PostRow";
import { YearHeader } from "./YearHeader";

export interface PostListProps {
	groups: Group[];
	/** Which row columns fit at this width. Same for every row. */
	fit: RowFit;
	/** Content width in cells. */
	cols: number;
	/** Visible height in cells. */
	rows: number;
	rh: () => number;
	onScroll: (top: number) => void;
}

/**
 * The scrolling post list, grouped by year.
 *
 * A real overflow container: touch gets native momentum, and PageUp/PageDown/
 * Home/End work for free because the element is focusable.
 *
 * The vertical rhythm is pushed to CSS from lib/rows.ts here. style.css used to
 * restate YEAR_GAP/GROUP_GAP/TAIL_ROWS as literal margins, which meant the
 * scrollbar -- drawn from totalRows() -- drifted away from the content if only
 * one side was changed.
 */
export function PostList(props: PostListProps): JSX.Element {
	let el!: HTMLElement;

	onMount(() => {
		attachScroll(el, props.rh, props.onScroll);
	});

	return (
		<section
			ref={el}
			class="cell postlist"
			style={{
				...cellVars(props.cols, props.rows),
				"--year-gap": String(YEAR_GAP),
				"--group-gap": String(GROUP_GAP),
				"--tail-rows": String(TAIL_ROWS),
			}}
			tabindex="0"
			aria-label="Posts"
		>
			<ul class="postlist__groups">
				<For each={props.groups}>
					{(group) => (
						<li class="postlist__group">
							<YearHeader year={group.year} art={group.art} />
							<ul class="group__items">
								<For each={group.posts}>
									{(post) => (
										<li class="postlist__item">
											<a
												class="postlist__link"
												href={post.href}
											>
												<PostRow
													post={post}
													fit={props.fit}
													cols={props.cols}
												/>
											</a>
										</li>
									)}
								</For>
							</ul>
						</li>
					)}
				</For>
			</ul>
		</section>
	);
}
