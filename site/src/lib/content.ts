import type { JSX } from "solid-js";
import type { Post } from "../data/posts";
import type { Kind } from "./taxonomy";

/**
 * A post's frontmatter. Every field an entry in data/posts.ts carries, plus a
 * description for the document head -- so a published post is described in one
 * place, its own file, rather than in a list that has to be kept in step.
 *
 * `date` is an ISO `YYYY-MM-DD` *string* and must stay quoted in the YAML:
 * lib/taxonomy.ts slices it and never parses it, and an unquoted date is one
 * schema change away from arriving here as a Date.
 */
export interface PostMeta {
	title: string;
	kind: Kind;
	date: string;
	minutes?: number;
	description?: string;
}

/** Anything the component map in components/mdx.tsx can override. */
export type MdxComponents = Record<string, unknown>;

export type MdxContent = (props: { components?: MdxComponents }) => JSX.Element;

export interface MdxModule {
	default: MdxContent;
	meta: PostMeta;
}

export interface Entry {
	slug: string;
	meta: PostMeta;
	Content: MdxContent;
	/** The same post as the index list sees it. */
	post: Post;
}

/** Where a post lives. The route pattern in index.tsx is built from this. */
export const POSTS_BASE = "/posts";

export const hrefFor = (slug: string): string => `${POSTS_BASE}/${slug}`;

// Eager: the modules are the site's content, so there is nothing to defer --
// and a lazy glob would make the index list itself async.
const modules = import.meta.glob<MdxModule>("../content/*.mdx", {
	eager: true,
});

const slugOf = (path: string): string =>
	path.slice(path.lastIndexOf("/") + 1).replace(/\.mdx$/, "");

export const entries: Entry[] = Object.entries(modules).map(([path, mod]) => {
	const slug = slugOf(path);
	const { title, kind, date, minutes } = mod.meta;
	return {
		slug,
		meta: mod.meta,
		Content: mod.default,
		post: { title, href: hrefFor(slug), kind, date, minutes },
	};
});

export const bySlug = new Map(entries.map((e) => [e.slug, e]));
