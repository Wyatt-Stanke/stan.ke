import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// No `base` on purpose: the site deploys to a custom domain at the root.
export default defineConfig({
	plugins: [solid()],
});
