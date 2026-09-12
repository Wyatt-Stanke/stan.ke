import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

/*
 * The build-time half of the content pipeline. src/lib/content.ts turns the
 * same files into components for the app; this turns them into the formats a
 * machine gets: Markdown with the interactive parts flattened, and a static
 * HTML rendering for anything that will not run the script.
 *
 * Both halves read the same .mdx files, and neither is generated from the
 * other -- but the frontmatter contract is shared, so PostMeta here mirrors
 * the one in src/lib/content.ts.
 */

export interface PostMeta {
	title: string;
	kind: string;
	date: string;
	minutes?: number;
	description?: string;
}

export interface PostSource {
	slug: string;
	meta: PostMeta;
	/** The file, verbatim. */
	mdx: string;
	/** The same file with JSX flattened to its text alternative. */
	markdown: string;
}

interface Offsets {
	start: { offset?: number };
	end: { offset?: number };
}

interface JsxNode {
	type: string;
	name?: string | null;
	attributes?: { type: string; name?: string; value?: unknown }[];
	position?: Offsets;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * The text a non-interactive reader gets in place of a component.
 *
 * `alt` is required by convention rather than by the type system -- there is
 * no compile step between an .mdx file and this -- so a component without one
 * degrades to its tag name instead of vanishing silently.
 */
function altOf(node: JsxNode): string {
	const attr = node.attributes?.find(
		(a) => a.type === "mdxJsxAttribute" && a.name === "alt",
	);
	if (typeof attr?.value === "string") return attr.value;
	return `${node.name ?? "component"} (no alt text)`;
}

/** Source offsets are only usable if remark actually recorded both ends. */
const spanOf = (node: JsxNode): [number, number] | null => {
	const s = node.position?.start.offset;
	const e = node.position?.end.offset;
	return typeof s === "number" && typeof e === "number" ? [s, e] : null;
};

/**
 * MDX to plain Markdown, by splicing the original text rather than
 * re-stringifying the tree.
 *
 * A round trip through remark-stringify would reformat every list marker,
 * table and escape in the file, so the .md a reader downloads would no longer
 * be the .md the author wrote. Splicing at node offsets leaves everything
 * that is already Markdown byte-identical.
 */
export function flatten(source: string): string {
	const tree = unified()
		.use(remarkParse)
		.use(remarkFrontmatter)
		.use(remarkGfm)
		.use(remarkMdx)
		.parse(source);

	const edits: { start: number; end: number; text: string }[] = [];

	visit(tree, (node) => {
		const n = node as unknown as JsxNode;
		if (n.type === "mdxjsEsm") {
			// import/export lines: machinery for the app, noise in a .md
			const span = spanOf(n);
			if (span) edits.push({ start: span[0], end: span[1], text: "" });
			return SKIP;
		}
		if (n.type === "mdxJsxFlowElement") {
			const span = spanOf(n);
			if (span) {
				edits.push({
					start: span[0],
					end: span[1],
					text: `> [interactive] ${altOf(n)}`,
				});
			}
			return SKIP;
		}
		if (n.type === "mdxJsxTextElement") {
			const span = spanOf(n);
			if (span) {
				edits.push({ start: span[0], end: span[1], text: altOf(n) });
			}
			return SKIP;
		}
		return undefined;
	});

	// Back to front, so an earlier splice cannot move a later offset.
	edits.sort((a, b) => b.start - a.start);
	let out = source;
	for (const edit of edits) {
		out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
	}

	// Removing a block leaves its surrounding blank lines behind.
	return `${out.replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/** Flattened Markdown to static HTML, highlighted the same way the app is. */
export function toHtml(markdown: string): string {
	return String(
		unified()
			.use(remarkParse)
			.use(remarkFrontmatter)
			.use(remarkGfm)
			.use(remarkRehype)
			.use(rehypeHighlight, { detect: false })
			.use(rehypeStringify)
			.processSync(markdown),
	);
}

export function readPosts(dir: string): PostSource[] {
	const posts: PostSource[] = [];

	for (const file of readdirSync(dir).sort()) {
		if (!file.endsWith(".mdx")) continue;
		const mdx = readFileSync(join(dir, file), "utf8");
		const head = FRONTMATTER.exec(mdx);
		if (!head) throw new Error(`${file}: no frontmatter`);
		const meta = parseYaml(head[1]) as PostMeta;
		if (typeof meta?.date !== "string") {
			// Everything downstream slices this string; an unquoted YAML date
			// can arrive as a Date and file the post under the wrong year.
			throw new Error(
				`${file}: frontmatter date must be a quoted string`,
			);
		}
		posts.push({
			slug: file.replace(/\.mdx$/, ""),
			meta,
			mdx,
			markdown: flatten(mdx),
		});
	}

	return posts;
}
