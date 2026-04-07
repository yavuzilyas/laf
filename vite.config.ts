import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	clearScreen: true,
	logLevel: 'error',
	build: {
		rollupOptions: {
			maxParallelFileOps: 2,
			output: {
				manualChunks: (id) => {
					// Vendor UI libraries
					if (id.includes('bits-ui') || id.includes('vaul-svelte') || 
					    id.includes('embla-carousel-svelte') || id.includes('formsnap') ||
					    id.includes('mode-watcher')) {
						return 'vendor-ui';
					}
					// Animation libraries
					if (id.includes('motion-sv') || id.includes('svelte-motion') || 
					    id.includes('svelte-animate-icons')) {
						return 'vendor-motion';
					}
					// Icon libraries
					if (id.includes('@lucide/svelte') || id.includes('@tabler/icons-svelte')) {
						return 'vendor-icons';
					}
					// Editor libraries - only loaded on write pages
					if (id.includes('@tiptap') || id.includes('svelte-tiptap') || 
					    id.includes('lowlight') || id.includes('katex') ||
					    id.includes('highlight.js')) {
						return 'editor';
					}
					// Chart libraries
					if (id.includes('layerchart') || id.includes('d3-')) {
						return 'charts';
					}
					// Heavy 3D animation - only when needed
					if (id.includes('@threlte') || id.includes('three')) {
						return 'animation-heavy';
					}
					// Large vendor libs
					if (id.includes('lodash') || id.includes('date-fns') || 
					    id.includes('zod')) {
						return 'vendor-large';
					}
				},
				// Ensure small chunks are merged to avoid too many requests
				experimentalMinChunkSize: 20000,
			},
		},
		sourcemap: false,
		minify: 'esbuild',
		// Reduce chunk size limits to encourage splitting
		chunkSizeWarningLimit: 500,
		cssMinify: true,
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		allowedHosts: [
			'localhost',
			'127.0.0.1',
			'0.0.0.0',
			'100.99.233.90',
			'100.90.216.14'
		],
		watch: {
			usePolling: true
		}
	}
});
