declare module "*.mdx" {
	const mod: import("./lib/content").MdxModule;
	export const meta: import("./lib/content").PostMeta;
	export default mod.default;
}
