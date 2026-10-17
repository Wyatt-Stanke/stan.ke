/**
 * Where a link goes, as far as the site is concerned: somewhere on it, or
 * somewhere else.
 *
 * The site's own host counts as internal however the link is written, so an
 * absolute https://stan.ke/... is routed in-app like a bare path instead of
 * being marked as leaving.
 */
export const SITE_HOSTS: ReadonlySet<string> = new Set([
	"stan.ke",
	"www.stan.ke",
]);

export type LinkTarget =
	/** A path on this site, for the router. */
	| { kind: "internal"; path: string }
	/** Anywhere else: another host, or another scheme entirely. */
	| { kind: "external"; url: URL }
	/** Fragments and relative paths, left to the browser as written. */
	| { kind: "local"; href: string };

const SCHEME = /^[a-z][a-z\d+.-]*:/i;

export function classify(href = ""): LinkTarget {
	const protocolRelative = href.startsWith("//");
	if (href.startsWith("/") && !protocolRelative) {
		return { kind: "internal", path: href };
	}
	if (!protocolRelative && !SCHEME.test(href)) return { kind: "local", href };

	let url: URL;
	try {
		url = new URL(href, "https://stan.ke");
	} catch {
		return { kind: "local", href };
	}

	const web = url.protocol === "https:" || url.protocol === "http:";
	if (web && SITE_HOSTS.has(url.hostname)) {
		return {
			kind: "internal",
			path: `${url.pathname}${url.search}${url.hash}`,
		};
	}
	return { kind: "external", url };
}

const decode = (s: string): string => {
	try {
		return decodeURI(s);
	} catch {
		return s;
	}
};

/**
 * The destination as a reader would say it: no scheme, no `www.`, no bare
 * trailing slash, and percent-escapes decoded. Anything that is not the web
 * keeps its scheme, because `mailto:` is most of what `mailto:a@b.c` says.
 */
export function destination(url: URL): string {
	if (url.protocol !== "https:" && url.protocol !== "http:") {
		return decode(url.href);
	}
	const host = url.host.replace(/^www\./, "");
	const path = url.pathname === "/" ? "" : url.pathname;
	return decode(`${host}${path}${url.search}${url.hash}`);
}
