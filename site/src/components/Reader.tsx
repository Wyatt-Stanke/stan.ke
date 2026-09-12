import { A } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createEffect, onCleanup, onMount, Show } from "solid-js";
import { type Entry, hrefFor } from "../lib/content";
import {
	BLOCK_GAP,
	HEAD_GAP,
	HEADING_LEAD,
	measureCols,
	TAIL_ROWS,
} from "../lib/prose";
import { attachScroll, isEditable } from "../lib/scroll";
import { formatDuration, KINDS, monthLabel, yearOf } from "../lib/taxonomy";
import { setTypeface, toggleTypeface, typeface } from "../lib/typeface";
import { cellVars } from "./Cell";
import { barState } from "./CharScrollbar";
import { mdxComponents } from "./mdx";
import { Rule } from "./Rule";
import { useShell } from "./Shell";

/** Toggling costs one keystroke, because the point of it is to try both. */
const TOGGLE_KEY = "f";

function TypefaceToggle(): JSX.Element {
	return (
		<fieldset class="reader__face">
			<legend class="sr-only">Typeface</legend>
			<button
				type="button"
				class="reader__facebtn"
				aria-pressed={typeface() === "mono"}
				onClick={() => setTypeface("mono")}
			>
				mono
			</button>
			<span class="reader__facesep" aria-hidden="true">
				|
			</span>
			<button
				type="button"
				class="reader__facebtn"
				aria-pressed={typeface() === "prose"}
				onClick={() => setTypeface("prose")}
			>
				roboto
			</button>
		</fieldset>
	);
}

/**
 * One post, filling the content region the list would otherwise have.
 *
 * The scroll container is the article, so the character scrollbar the shell
 * draws keeps working unchanged -- but it is fed measured pixels rather than
 * a row count, because in `prose` the lines are laid out by the browser and
 * their number is not something this side can derive.
 */
export function Reader(props: { entry: Entry }): JSX.Element {
	let el!: HTMLElement;
	let body!: HTMLElement;

	const shell = useShell();
	const meta = () => props.entry.meta;
	const spec = () => KINDS[meta().kind];
	const measure = () => measureCols(shell.cols());

	/*
	 * What the document says about itself, kept the same however the page was
	 * reached. A cold load gets a static file that already carries all of this
	 * (see staticSite() in vite.config.ts); a click from the index renders the
	 * same post into a document that carries none of it, and the two should
	 * not disagree about where the Markdown lives.
	 */
	createEffect(() => {
		const href = hrefFor(props.entry.slug);
		const description = meta().description ?? meta().title;

		document.title = `${meta().title} — Wyatt Stanke`;

		const added: HTMLLinkElement[] = [];
		for (const [rel, type, url] of [
			["canonical", "", href],
			["alternate", "text/markdown", `${href}.md`],
			["alternate", "text/mdx", `${href}.mdx`],
		]) {
			// The static file put these here already; adding a second copy
			// would make the page contradict itself rather than repeat itself.
			if (
				document.head.querySelector(`link[rel="${rel}"][href="${url}"]`)
			)
				continue;
			const link = document.createElement("link");
			link.rel = rel;
			if (type) link.type = type;
			link.href = url;
			document.head.append(link);
			added.push(link);
		}

		const metaEl = document.head.querySelector<HTMLMetaElement>(
			'meta[name="description"]',
		);
		const previous = metaEl?.content;
		if (metaEl) metaEl.content = description;

		onCleanup(() => {
			for (const link of added) link.remove();
			if (metaEl && previous !== undefined) metaEl.content = previous;
		});
	});

	onMount(() => {
		const controls = attachScroll(
			el,
			() => shell.cell().rh,
			(view) => shell.setBar(barState(view.top, view.max, view.viewport)),
			{ snap: () => typeface() === "mono" },
		);

		// The bar is drawn from measured height, and the things that change
		// that height mostly do not fire a scroll event: a reflow when the
		// measure narrows, an image arriving, and -- the one no signal here
		// can see -- Roboto swapping in after its own late request.
		const ro = new ResizeObserver(() => controls.sync());
		ro.observe(el);
		ro.observe(body);
		onCleanup(() => ro.disconnect());
	});

	const onKey = (ev: KeyboardEvent) => {
		if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
		if (isEditable(ev.target)) return;
		if (ev.key !== TOGGLE_KEY) return;
		ev.preventDefault();
		toggleTypeface();
	};
	window.addEventListener("keydown", onKey);
	onCleanup(() => window.removeEventListener("keydown", onKey));

	const Content = props.entry.Content;

	return (
		<section
			ref={el}
			class="cell reader"
			style={{
				...cellVars(shell.cols(), shell.rows()),
				"--block-gap": String(BLOCK_GAP),
				"--heading-lead": String(HEADING_LEAD),
				"--head-gap": String(HEAD_GAP),
				"--tail-rows": String(TAIL_ROWS),
			}}
			tabindex="0"
			aria-label={meta().title}
		>
			<article
				ref={body}
				class="reader__body"
				style={{ "--measure": String(measure()) }}
			>
				<header class="reader__head">
					<div class="reader__nav">
						<A class="reader__back" href="/">
							{"<- index"}
						</A>
						<TypefaceToggle />
					</div>

					<h1 class="reader__title">{meta().title}</h1>

					<p class="reader__meta">
						<time datetime={meta().date}>
							{`${monthLabel(meta().date)} ${yearOf(meta().date)}`}
						</time>
						<span class="reader__kind" data-medium={spec().medium}>
							<span class="glyph" aria-hidden="true">
								{spec().glyph}
							</span>
							{` ${spec().label}`}
						</span>
						<Show when={meta().minutes != null}>
							<span>{formatDuration(meta().minutes)}</span>
						</Show>
					</p>

					<Rule cols={measure()} />
				</header>

				<div class="prose">
					<Content components={mdxComponents} />
				</div>
			</article>
		</section>
	);
}
