import type { JSX } from "solid-js";
import { For, onMount } from "solid-js";
import type { LayoutMode } from "../lib/layout";
import type { Group } from "../lib/rows";
import { attachScroll } from "../lib/scroll";
import { cellVars } from "./Cell";
import { PostRow } from "./PostRow";
import { YearHeader } from "./YearHeader";

export interface PostListProps {
	groups: Group[];
	mode: LayoutMode;
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
 * The vertical gaps are margins here and constants in lib/rows.ts, and the two
 * have to agree -- totalRows() is what the scrollbar is drawn from, so a margin
 * changed on one side only shows up as the bar drifting away from the content.
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
			style={cellVars(props.cols, props.rows)}
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
													mode={props.mode}
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
