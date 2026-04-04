import type { LayoutServerLoad } from './$types';
import type { LocaleData } from '$lib/stores/i18n.svelte';

// Static import of translations for SSR
import trTranslations from '$lib/locales/tr.json';
import enTranslations from '$lib/locales/en.json';

const TRANSLATIONS: Record<string, LocaleData> = {
	tr: trTranslations as LocaleData,
	en: enTranslations as LocaleData
};

export const load: LayoutServerLoad = async ({ locals }) => {
	const locale = locals.locale || 'tr';
	const translations = TRANSLATIONS[locale] || TRANSLATIONS['tr'];
	
	return {
		user: locals.user ?? null,
		locale,
		translations
	};
};
