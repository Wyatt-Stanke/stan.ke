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

export const posts: Post[] = [];