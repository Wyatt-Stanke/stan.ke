import { Route, Router } from "@solidjs/router";
import type { JSX } from "solid-js";
import { Shell } from "./components/Shell";
import { POSTS_BASE } from "./lib/content";
import { Index } from "./pages/Index";
import { NotFound } from "./pages/NotFound";
import { PostPage } from "./pages/PostPage";

/**
 * History routing, not hash: the deploy ships a 404.html copy of the shell
 * (see the spaFallback plugin in vite.config.ts), which is what lets GitHub
 * Pages answer a cold load of /posts/<slug> with the app.
 */
export function App(): JSX.Element {
	return (
		<Router root={Shell}>
			<Route path="/" component={Index} />
			<Route path={`${POSTS_BASE}/:slug`} component={PostPage} />
			<Route path="*" component={NotFound} />
		</Router>
	);
}
