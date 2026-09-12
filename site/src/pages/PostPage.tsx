import { useParams } from "@solidjs/router";
import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { Reader } from "../components/Reader";
import { bySlug } from "../lib/content";
import { NotFound } from "./NotFound";

export function PostPage(): JSX.Element {
	const params = useParams<{ slug: string }>();
	const entry = () => bySlug.get(params.slug);

	return (
		<Show when={entry()} fallback={<NotFound what="post" />}>
			{(found) => <Reader entry={found()} />}
		</Show>
	);
}
