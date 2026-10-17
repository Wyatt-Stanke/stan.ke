/*
 * Footnotes, moved to where they are cited.
 *
 * remark-gfm compiles `[^1]` the way GitHub renders it: a numbered link in the
 * text and every definition gathered into a list at the foot of the page. That
 * is a fine static rendering -- the .html fallback keeps it, see toHtml() in
 * scripts/content.ts -- but in the app it means a jump to the end and a jump
 * back per note.
 *
 * So for the app, each reference becomes a <Footnote> carrying its own copy of
 * the definition, and the list at the foot is dropped. components/Notes.tsx
 * then decides per width whether that copy hangs in the margin or opens
 * inline under the line.
 *
 * The node shapes are declared here rather than imported, as in
 * scripts/content.ts: hast's types are not a dependency of this package, and
 * the plugin touches four fields of them.
 */

interface HNode {
	type: string;
	children?: HNode[];
}

interface HElement extends HNode {
	type: "element";
	tagName: string;
	properties: Record<string, unknown>;
	children: HNode[];
}

interface HText extends HNode {
	type: "text";
	value: string;
}

interface JsxElement extends HNode {
	type: "mdxJsxTextElement";
	name: string;
	attributes: { type: "mdxJsxAttribute"; name: string; value: string }[];
	children: HNode[];
}

const isElement = (n: HNode, tag?: string): n is HElement =>
	n.type === "element" &&
	(tag === undefined || (n as HElement).tagName === tag);

const isText = (n: HNode): n is HText => n.type === "text";

const textOf = (n: HNode): string =>
	isText(n) ? n.value : (n.children ?? []).map(textOf).join("");

const findChild = (
	parent: HNode,
	test: (n: HNode) => boolean,
): HNode | undefined => {
	for (const child of parent.children ?? []) {
		if (test(child)) return child;
		const deeper = findChild(child, test);
		if (deeper) return deeper;
	}
	return undefined;
};

const isFootnoteList = (n: HNode): boolean =>
	isElement(n, "section") && "dataFootnotes" in n.properties;

const isRef = (n: HNode): boolean =>
	isElement(n, "a") && "dataFootnoteRef" in n.properties;

const isBackref = (n: HNode): boolean =>
	isElement(n, "a") && "dataFootnoteBackref" in n.properties;

/** Drops the ↩ links, and the space GFM leaves in front of each. */
function stripBackrefs(node: HNode): void {
	if (!node.children) return;
	const kept: HNode[] = [];
	for (const child of node.children) {
		if (isBackref(child)) {
			const prev = kept.at(-1);
			if (prev && isText(prev)) prev.value = prev.value.trimEnd();
			continue;
		}
		stripBackrefs(child);
		kept.push(child);
	}
	node.children = kept;
}

/**
 * A definition rewritten to sit inside a paragraph, which is where its copy
 * ends up. A definition is blocks -- one <p> per paragraph -- and a <p> inside
 * a <p> is not something HTML can say, so each becomes a span that the note's
 * own styles set as a block.
 */
function asInline(li: HElement): HNode[] {
	const body = structuredClone(li.children).filter(
		(n) => !(isText(n) && n.value.trim() === ""),
	);
	for (const n of body) {
		if (isElement(n, "p")) {
			n.tagName = "span";
			n.properties = { className: ["prose__note-p"] };
		}
	}
	return body;
}

/** `user-content-fnref-a-2` → `note-a-2`: one id per citation, not per note. */
const noteId = (refId: unknown): string =>
	`note-${String(refId).replace(/^.*?fnref-/, "")}`;

export function rehypeNotes() {
	return (tree: HNode): void => {
		const root = tree.children ?? [];
		const at = root.findIndex(isFootnoteList);
		if (at === -1) return;
		const [list] = root.splice(at, 1);

		stripBackrefs(list);
		const bodies = new Map<string, HElement>();
		const collect = (n: HNode) => {
			if (isElement(n, "li") && typeof n.properties.id === "string") {
				bodies.set(`#${n.properties.id}`, n);
			}
			n.children?.forEach(collect);
		};
		collect(list);

		const rewrite = (parent: HNode) => {
			const kids = parent.children;
			if (!kids) return;
			kids.forEach((child, i) => {
				const ref = isElement(child, "sup")
					? findChild(child, isRef)
					: undefined;
				const li =
					ref &&
					bodies.get(String((ref as HElement).properties.href));
				if (!ref || !li) {
					rewrite(child);
					return;
				}
				const note: JsxElement = {
					type: "mdxJsxTextElement",
					name: "Footnote",
					attributes: [
						{
							type: "mdxJsxAttribute",
							name: "n",
							value: textOf(ref),
						},
						{
							type: "mdxJsxAttribute",
							name: "id",
							value: noteId((ref as HElement).properties.id),
						},
					],
					children: asInline(li),
				};
				kids[i] = note;
			});
		};
		rewrite(tree);
	};
}
