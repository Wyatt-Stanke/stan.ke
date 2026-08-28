/**
 * Pure port of drawScrollBar() (main.ts:234-262). Returns one newline-joined
 * column of `count` characters.
 *
 * Differences from the original, both deliberate:
 *   - `pct` is clamped to [0, 1]. The original relied on drawPostList() having
 *     clamped the shared scrollPos global first (main.ts:267).
 *   - `s`/`e` are hoisted out of the loop; the original recomputed them
 *     identically on every iteration.
 */
export function scrollbarChars(
	count: number,
	scroll: number,
	total: number,
): string {
	const pct = Math.min(1, Math.max(0, scroll / Math.max(1, total - count)));
	const height = Math.max((count / Math.max(count, total)) * count, 1);
	const start = pct * (count - height);
	const s = Math.floor(start);
	const e = Math.floor(start + height) - 1;

	const out: string[] = new Array(count);
	for (let i = 0; i < count; i++) {
		out[i] = i < s || i > e ? "|" : i === s ? "n" : i === e ? "u" : "#";
	}
	return out.join("\n");
}
