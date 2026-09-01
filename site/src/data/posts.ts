import type { Kind } from "../lib/taxonomy";

export interface Post {
	title: string;
	href: string;
	kind: Kind;
	/** ISO `YYYY-MM-DD`. Sliced, never Date-parsed -- see lib/taxonomy.ts. */
	date: string;
	/**
	 * Read time for writing, runtime for video. Absent for interactive things,
	 * which have no duration -- the meta column is simply blank there.
	 *
	 * Stored as the real number rather than a hand-written "short"/"long" so
	 * the subtype stays derivable and the meta column has something to show.
	 */
	minutes?: number;
}

// Placeholder content. Every title says "sample" and every href is a dead
// fragment, so nothing here can quietly ship as real content.
//
// The set is shaped to exercise the layout: all eight kinds, five years with
// different post counts, durations either side of the hour boundary (63 ->
// 1h03, 310 -> 5h10), interactive kinds with no duration at all, and a few
// titles long enough to truncate in each mode. Five years is also more rows
// than any viewport holds, so the scrollbar and the row snapping are visible.
export const posts: Post[] = [
	{
		title: "Sample post 1",
		href: "#sample-post-1",
		kind: "post",
		date: "2026-08-14",
		minutes: 4,
	},
	{
		title: "Sample post 2",
		href: "#sample-post-2",
		kind: "post",
		date: "2026-07-30",
		minutes: 3,
	},
	{
		title: "Sample essay 1",
		href: "#sample-essay-1",
		kind: "essay",
		date: "2026-07-02",
		minutes: 22,
	},
	{
		title: "Sample video 1",
		href: "#sample-video-1",
		kind: "video",
		date: "2026-06-18",
		minutes: 34,
	},
	{
		title: "Sample short 1",
		href: "#sample-short-1",
		kind: "short",
		date: "2026-06-05",
		minutes: 1,
	},
	{
		title: "Sample site 1",
		href: "#sample-site-1",
		kind: "site",
		date: "2026-05-21",
	},
	{
		title: "Sample game 1",
		href: "#sample-game-1",
		kind: "game",
		date: "2026-04-09",
	},
	{
		title: "Sample post 3",
		href: "#sample-post-3",
		kind: "post",
		date: "2026-03-27",
		minutes: 6,
	},
	{
		title: "Sample essay 2, with a title long enough to run past the end of the row and get truncated",
		href: "#sample-essay-2",
		kind: "essay",
		date: "2026-02-11",
		minutes: 18,
	},
	{
		title: "Sample app 1",
		href: "#sample-app-1",
		kind: "app",
		date: "2026-01-30",
	},
	{
		title: "Sample series 1",
		href: "#sample-series-1",
		kind: "series",
		date: "2025-12-12",
		minutes: 140,
	},
	{
		title: "Sample post 4",
		href: "#sample-post-4",
		kind: "post",
		date: "2025-11-24",
		minutes: 7,
	},
	{
		title: "Sample post 5, with a medium-length title",
		href: "#sample-post-5",
		kind: "post",
		date: "2025-10-08",
		minutes: 5,
	},
	{
		title: "Sample essay 3",
		href: "#sample-essay-3",
		kind: "essay",
		date: "2025-09-19",
		minutes: 31,
	},
	{
		title: "Sample video 2, with a longer title than the one above",
		href: "#sample-video-2",
		kind: "video",
		date: "2025-08-02",
		minutes: 26,
	},
	{
		title: "Sample app 2",
		href: "#sample-app-2",
		kind: "app",
		date: "2025-06-30",
	},
	{
		title: "Sample short 2",
		href: "#sample-short-2",
		kind: "short",
		date: "2025-05-14",
		minutes: 2,
	},
	{
		title: "Sample game 2, long enough to truncate in split mode as well as stack",
		href: "#sample-game-2",
		kind: "game",
		date: "2025-04-03",
	},
	{
		title: "Sample post 6",
		href: "#sample-post-6",
		kind: "post",
		date: "2025-02-21",
		minutes: 8,
	},
	{
		title: "Sample post 7",
		href: "#sample-post-7",
		kind: "post",
		date: "2024-12-01",
		minutes: 5,
	},
	{
		title: "Sample essay 4",
		href: "#sample-essay-4",
		kind: "essay",
		date: "2024-10-17",
		minutes: 24,
	},
	{
		title: "Sample video 3",
		href: "#sample-video-3",
		kind: "video",
		date: "2024-09-05",
		minutes: 63,
	},
	{
		title: "Sample short 3",
		href: "#sample-short-3",
		kind: "short",
		date: "2024-07-22",
		minutes: 3,
	},
	{
		title: "Sample site 2",
		href: "#sample-site-2",
		kind: "site",
		date: "2024-05-30",
	},
	{
		title: "Sample series 2",
		href: "#sample-series-2",
		kind: "series",
		date: "2024-03-11",
		minutes: 245,
	},
	{
		title: "Sample post 8",
		href: "#sample-post-8",
		kind: "post",
		date: "2024-01-06",
		minutes: 1,
	},
	{
		title: "Sample essay 5",
		href: "#sample-essay-5",
		kind: "essay",
		date: "2023-11-08",
		minutes: 27,
	},
	{
		title: "Sample post 9",
		href: "#sample-post-9",
		kind: "post",
		date: "2023-10-19",
		minutes: 4,
	},
	{
		title: "Sample short 4",
		href: "#sample-short-4",
		kind: "short",
		date: "2023-09-02",
		minutes: 2,
	},
	{
		title: "Sample game 3",
		href: "#sample-game-3",
		kind: "game",
		date: "2023-07-14",
	},
	{
		title: "Sample post 10, with another medium-length title",
		href: "#sample-post-10",
		kind: "post",
		date: "2023-06-06",
		minutes: 9,
	},
	{
		title: "Sample video 4",
		href: "#sample-video-4",
		kind: "video",
		date: "2023-04-25",
		minutes: 41,
	},
	{
		title: "Sample site 3",
		href: "#sample-site-3",
		kind: "site",
		date: "2023-03-03",
	},
	{
		title: "Sample post 11",
		href: "#sample-post-11",
		kind: "post",
		date: "2023-01-17",
		minutes: 3,
	},
	{
		title: "Sample app 3",
		href: "#sample-app-3",
		kind: "app",
		date: "2022-12-09",
	},
	{
		title: "Sample post 12",
		href: "#sample-post-12",
		kind: "post",
		date: "2022-11-11",
		minutes: 6,
	},
	{
		title: "Sample series 3",
		href: "#sample-series-3",
		kind: "series",
		date: "2022-09-21",
		minutes: 310,
	},
	{
		title: "Sample essay 6",
		href: "#sample-essay-6",
		kind: "essay",
		date: "2022-07-05",
		minutes: 15,
	},
	{
		title: "Sample short 5",
		href: "#sample-short-5",
		kind: "short",
		date: "2022-04-12",
		minutes: 1,
	},
	{
		title: "Sample post 13, the oldest entry in the sample set",
		href: "#sample-post-13",
		kind: "post",
		date: "2022-02-02",
		minutes: 2,
	},
];
