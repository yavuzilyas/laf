import type { LayoutServerLoad } from './$types';
import type { LocaleData } from '$lib/stores/i18n.svelte';

const localeModules = import.meta.glob('/src/lib/locales/*.json', { eager: true, import: 'default' });

const TRANSLATIONS: Record<string, LocaleData> = {};
for (const path in localeModules) {
	const match = path.match(/\/([^/]+)\.json$/);
	if (match) {
		TRANSLATIONS[match[1]] = localeModules[path] as LocaleData;
	}
}

export const load: LayoutServerLoad = async ({ locals }) => {
	const locale = locals.locale || 'tr';
	const translations = TRANSLATIONS[locale] || TRANSLATIONS['tr'];
	
	return {
		user: locals.user ?? null,
		locale,
		translations
	};
};
