import { A, useLocation } from "@solidjs/router";
import type { JSX } from "solid-js";
import { createEffect } from "solid-js";
import { cellVars } from "../components/Cell";
import { FULL_BAR } from "../components/CharScrollbar";
import { useShell } from "../components/Shell";

export function NotFound(props: { what?: string }): JSX.Element {
	const shell = useShell();
	const location = useLocation();

	createEffect(() => {
		shell.setBar(FULL_BAR);
		document.title = "Not found — Wyatt Stanke";
	});

	return (
		<section
			class="cell missing"
			style={cellVars(shell.cols(), shell.rows())}
		>
			<p>{`no ${props.what ?? "page"} at ${location.pathname}`}</p>
			<p>
				<A class="prose__link" href="/">
					{"<- index"}
				</A>
			</p>
		</section>
	);
}
