import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$db: './src/db'
		}
	},
	alias: {
      "@/*": "./path/to/lib/*",
    }
  ,
  // Silence noisy non-critical warnings to keep terminal clean
  onwarn: (warning, handler) => {
    const ignoreCodes = new Set([
      'state_referenced_locally',
      'element_invalid_self_closing_tag',
      'element_implicitly_closed',
      'legacy_code',
      'svelte_component_deprecated'
    ]);
    if (ignoreCodes.has(warning.code)) return;
    handler(warning);
  }
};

export default config;
