// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com',
	integrations: [mdx(), sitemap()],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Inter',
			cssVariable: "--font-inter"
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Shantell Sans',
			cssVariable: "--font-shantell-sans"
		},
		{
			provider: fontProviders.fontsource(),
			name: 'Atkinson Hyperlegible',
			cssVariable: "--font-atkinson"
		}
	],
});
