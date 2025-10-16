import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	clearScreen: true,
	logLevel: 'error',
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
