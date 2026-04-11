import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			entryPoint: 'src/server.js',
			bodySizeLimit: 5 * 1024 * 1024 // 4MB
		}),
		csrf: {
			trustedOrigins: []
		},
		alias: {
			$db: './src/db'
		}
	}
};

export default config;
