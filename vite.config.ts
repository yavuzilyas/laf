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
				manualChunks: {
					// Vendor chunks - stable, cached dependencies
					'vendor-ui': ['bits-ui', 'vaul-svelte', 'embla-carousel-svelte', 'formsnap'],
					'vendor-motion': ['motion-sv', 'svelte-motion', 'svelte-animate-icons'],
					'vendor-icons': ['@lucide/svelte', '@tabler/icons-svelte'],
					'vendor-utils': ['clsx', 'tailwind-merge', 'tailwind-variants'],
					// Heavy feature chunks - only loaded when needed
					'editor': ['@tiptap/core', '@tiptap/starter-kit', 'svelte-tiptap', 'lowlight', 'katex'],
					'charts': ['layerchart', 'd3-scale', 'd3-shape'],
					'animation-heavy': ['@threlte/core', '@threlte/extras', 'three'],
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
