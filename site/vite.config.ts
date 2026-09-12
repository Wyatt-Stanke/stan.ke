import { fileURLToPath } from "node:url";
import mdx from "@mdx-js/rollup";
import rehypeHighlight from "rehype-highlight";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { type PostSource, readPosts, toHtml } from "./scripts/content";

const CONTENT_DIR = fileURLToPath(new URL("./src/content", import.meta.url));

const esc = (s: string): string =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const APP_DIV = '<div id="app"></div>';

/**
 * Static content dropped in where the app will mount, plus the inline script
 * that clears it.
 *
 * The script is a classic inline one placed immediately after the container,
 * so it runs during parsing and the fallback is gone before first paint. The
 * module bundle is deferred and would not run until after, which is a visible
 * flash of the fallback on every load.
 */
const withFallback = (inner: string): string =>
	`<div id="app">${inner}</div>\n<script>document.getElementById("app").replaceChildren()</script>`;

function formatIndex(slug: string): string {
	return `<!--
  This post is available in three formats:

    /posts/${slug}       this page -- HTML, interactive parts live
    /posts/${slug}.md    Markdown, interactive parts flattened to their alt text
    /posts/${slug}.mdx   the MDX source, exactly as written

  The <article> below is a complete static rendering of the post, so this file
  is readable without running anything. A script removes it during parsing and
  the app renders the same post in its place.
-->`;
}

/** The post's own head tags, replacing the shell's site-level ones. */
function postHead(post: PostSource): string {
	const { slug, meta } = post;
	const description = meta.description ?? meta.title;
	return [
		`<link rel="canonical" href="/posts/${slug}" />`,
		`<link rel="alternate" type="text/markdown" href="/posts/${slug}.md" title="${esc(meta.title)} as Markdown" />`,
		`<link rel="alternate" type="text/mdx" href="/posts/${slug}.mdx" title="${esc(meta.title)} as MDX source" />`,
		`<meta property="og:type" content="article" />`,
		`<meta property="og:title" content="${esc(meta.title)}" />`,
		`<meta property="og:description" content="${esc(description)}" />`,
		`<meta property="article:published_time" content="${esc(meta.date)}" />`,
	].join("\n    ");
}

function postPage(shell: string, post: PostSource): string {
	const { meta } = post;
	const description = meta.description ?? meta.title;

	const article = [
		"<article>",
		`<h1>${esc(meta.title)}</h1>`,
		`<p><time datetime="${esc(meta.date)}">${esc(meta.date)}</time> &middot; ${esc(meta.kind)}${
			meta.minutes == null ? "" : ` &middot; ${meta.minutes} min`
		}</p>`,
		toHtml(post.markdown),
		'<p><a href="/">Index</a></p>',
		"</article>",
	].join("\n");

	return shell
		.replace(
			/<title>[\s\S]*?<\/title>/,
			`<title>${esc(meta.title)} — Wyatt Stanke</title>`,
		)
		.replace(
			/<meta name="description"[^>]*>/,
			`<meta name="description" content="${esc(description)}" />`,
		)
		.replace("</head>", `  ${postHead(post)}\n  </head>`)
		.replace(
			APP_DIV,
			`${formatIndex(post.slug)}\n${withFallback(article)}`,
		);
}

/** Without this the posts exist but nothing that cannot run the app can find them. */
function indexPage(shell: string, posts: PostSource[]): string {
	const list = posts
		.map(
			(p) =>
				`<li><a href="/posts/${p.slug}">${esc(p.meta.title)}</a> <time datetime="${esc(p.meta.date)}">${esc(p.meta.date)}</time></li>`,
		)
		.join("\n");
	return shell.replace(
		APP_DIV,
		withFallback(`<h1>Wyatt Stanke</h1>\n<ul>\n${list}\n</ul>`),
	);
}

/**
 * Everything the build emits for a client that will not run the app: a static
 * page per post, the Markdown and MDX behind it, a static index so all of that
 * is reachable, and the 404 fallback history routing needs.
 *
 * One plugin rather than several because they share one input -- the built
 * index.html -- and the post pages have to be derived from it *before* the
 * static index is injected into it, which is not something plugin ordering
 * should be trusted to express.
 */
function staticSite(): Plugin {
	return {
		name: "static-site",
		apply: "build",
		// index.html is itself emitted during generateBundle by vite's own html
		// plugin, so this has to be the last plugin and the last hook in it.
		enforce: "post",
		generateBundle: {
			order: "post",
			handler(_options, bundle) {
				const index = bundle["index.html"];
				if (index?.type !== "asset") {
					this.error("static-site: no index.html in the bundle");
				}
				const shell = String(index.source);
				const posts = readPosts(CONTENT_DIR);

				for (const post of posts) {
					// `foo.html` and not `foo/index.html`: GitHub Pages serves
					// the former at the extensionless path, where the latter
					// costs a redirect to a trailing slash.
					this.emitFile({
						type: "asset",
						fileName: `posts/${post.slug}.html`,
						source: postPage(shell, post),
					});
					this.emitFile({
						type: "asset",
						fileName: `posts/${post.slug}.md`,
						source: post.markdown,
					});
					this.emitFile({
						type: "asset",
						fileName: `posts/${post.slug}.mdx`,
						source: post.mdx,
					});
				}

				index.source = indexPage(shell, posts);
				// GitHub Pages serves this for any path it holds no file for,
				// which is what answers a cold load of an unknown client-side
				// route. Copied from the finished index so its hashed asset
				// URLs can never go stale.
				this.emitFile({
					type: "asset",
					fileName: "404.html",
					source: index.source,
				});
			},
		},
	};
}

// No `base` on purpose: the site deploys to a custom domain at the root.
export default defineConfig({
	plugins: [
		// `enforce: "pre"` so .mdx becomes JSX before vite-plugin-solid sees
		// it, and `jsx: true` so MDX leaves that JSX alone: Solid compiles JSX
		// at build time and has no automatic runtime for MDX to call into.
		{
			enforce: "pre",
			...mdx({
				jsx: true,
				remarkPlugins: [
					remarkFrontmatter,
					[remarkMdxFrontmatter, { name: "meta" }],
					remarkGfm,
				],
				// Highlighting runs here, at build time, so the app ships
				// static spans and no highlighter.
				rehypePlugins: [[rehypeHighlight, { detect: false }]],
			}),
		},
		solid({ extensions: [".mdx"] }),
		staticSite(),
	],
});
