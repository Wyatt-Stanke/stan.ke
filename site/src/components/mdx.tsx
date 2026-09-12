import { A } from "@solidjs/router";
import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { MdxComponents } from "../lib/content";
import { BULLET_COLS, MEASURE_COLS, NUMBER_COLS } from "../lib/prose";
import { Rail } from "./Rail";

interface Kids {
	children?: JSX.Element;
}

/**
 * A rule that fills its parent and clips at that edge, rather than one drawn
 * to a column count.
 *
 * That is what lets the heading ladder be a single idiom: the same element
 * underlines the full measure below an h2 and only the text below an h3,
 * because the two differ in what their box shrinks to, not in what is drawn.
 * It is out of flow so that its own MEASURE_COLS of characters cannot widen a
 * shrink-to-fit heading to the full measure.
 */
function Underline(props: { char?: string }): JSX.Element {
	return (
		<pre class="prose__underline" aria-hidden="true">
			{(props.char ?? "X").repeat(MEASURE_COLS)}
		</pre>
	);
}

/** h2 and h3: text, then a rule whose length is the level. */
function Ruled(props: { level: 2 | 3; children?: JSX.Element }): JSX.Element {
	const inner = (
		<span class="prose__h-fit">
			<span class="prose__h-text">{props.children}</span>
			<Underline />
		</span>
	);

	return (
		<Show
			when={props.level === 2}
			fallback={<h3 class="prose__h">{inner}</h3>}
		>
			<h2 class="prose__h">{inner}</h2>
		</Show>
	);
}

function Link(props: { href?: string } & Kids): JSX.Element {
	const internal = () => props.href?.startsWith("/") ?? false;
	const external = () => /^[a-z]+:/i.test(props.href ?? "");

	return (
		<Show
			when={internal()}
			fallback={
				<a
					class="prose__link"
					href={props.href}
					target={external() ? "_blank" : undefined}
					rel={external() ? "noreferrer noopener" : undefined}
				>
					{props.children}
				</a>
			}
		>
			<A class="prose__link" href={props.href ?? "/"}>
				{props.children}
			</A>
		</Show>
	);
}

/**
 * Every tag markdown, GFM and the highlighter can produce.
 *
 * The list has to be exhaustive, and that is not a style choice. MDX defaults
 * each entry of its component table to the *string* tag name, which works for
 * a runtime JSX factory but not for Solid: `<_components.td>` compiles to
 * createComponent(_components.td), and a string is not callable. A tag left
 * out of this table does not fall back to plain HTML, it throws the first time
 * a post uses it.
 *
 * Raw JSX written inside an .mdx file does not come through here -- Solid
 * compiles it as an ordinary element -- so this covers markdown syntax only.
 */
const MARKDOWN_TAGS = [
	"a",
	"blockquote",
	"br",
	"code",
	"del",
	"em",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"hr",
	"img",
	"input",
	"li",
	"ol",
	"p",
	"pre",
	"section",
	"span",
	"strong",
	"sup",
	"table",
	"tbody",
	"td",
	"th",
	"thead",
	"tr",
	"ul",
] as const;

const passthrough = (tag: string) => (props: Record<string, unknown>) => (
	<Dynamic component={tag} {...props} />
);

const defaults: MdxComponents = Object.fromEntries(
	MARKDOWN_TAGS.map((tag) => [tag, passthrough(tag)]),
);

/**
 * What MDX renders each markdown element as.
 *
 * Two things run through every entry here. Blocks are drawn out of the same
 * charset as the rest of the site -- rules and rails, never a CSS border --
 * and anything monospaced by meaning (code, markers, rules) stays monospaced
 * in both typefaces, so only the running text actually changes face.
 */
export const mdxComponents: MdxComponents = {
	...defaults,

	// A body-level h1 would restate the page title, so it is drawn as the
	// section heading it almost certainly meant to be.
	h1: (props: Kids) => <Ruled level={2}>{props.children}</Ruled>,
	h2: (props: Kids) => <Ruled level={2}>{props.children}</Ruled>,
	h3: (props: Kids) => <Ruled level={3}>{props.children}</Ruled>,
	h4: (props: Kids) => <h4 class="prose__minor">{props.children}</h4>,
	h5: (props: Kids) => <h5 class="prose__minor">{props.children}</h5>,
	h6: (props: Kids) => <h6 class="prose__minor">{props.children}</h6>,

	p: (props: Kids) => <p class="prose__p">{props.children}</p>,

	a: Link,

	ul: (props: Kids) => (
		<ul
			class="prose__list"
			style={{ "--marker-cols": String(BULLET_COLS) }}
		>
			{props.children}
		</ul>
	),
	ol: (props: Kids) => (
		<ol
			class="prose__list"
			data-marker="number"
			style={{ "--marker-cols": String(NUMBER_COLS) }}
		>
			{props.children}
		</ol>
	),
	li: (props: Kids) => <li class="prose__item">{props.children}</li>,

	blockquote: (props: Kids) => (
		<blockquote class="prose__quote">
			<Rail />
			<div class="prose__railed">{props.children}</div>
		</blockquote>
	),

	// The wrapper owns the rail so it stays put while the code scrolls under
	// it; `pre` itself is the horizontal scroll container.
	pre: (props: Kids) => (
		<div class="prose__pre">
			<Rail />
			<pre class="prose__railed prose__code-block">{props.children}</pre>
		</div>
	),

	// One component for both positions: inside .prose__code-block the block
	// rules take over, so nothing here has to sniff the language class. It is
	// carried through rather than dropped, because `language-ts` on the
	// element is the only place a reader of the HTML can learn the language.
	code: (props: Kids & { className?: string }) => (
		<code class={`prose__code ${props.className ?? ""}`.trimEnd()}>
			{props.children}
		</code>
	),

	hr: () => (
		<div class="prose__hr">
			<Underline />
		</div>
	),

	table: (props: Kids) => (
		<div class="prose__tablewrap">
			<table class="prose__table">{props.children}</table>
		</div>
	),

	img: (props: JSX.ImgHTMLAttributes<HTMLImageElement>) => (
		<img
			class="prose__img"
			loading="lazy"
			{...props}
			alt={props.alt ?? ""}
		/>
	),
};
