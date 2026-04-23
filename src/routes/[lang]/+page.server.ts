import type { PageServerLoad } from './$types';
import { getFeaturedArticles } from '$db/queries';

export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        const currentLocale = params.lang || 'tr';
        const featuredArticles = await getFeaturedArticles(3, undefined, currentLocale);

        // Debug logging
        console.log('[DEBUG] Featured articles count:', featuredArticles.length);
        console.log('[DEBUG] User:', locals.user?.username || 'anonymous', 'Role:', locals.user?.role || 'none');
        console.log('[DEBUG] Featured articles:', featuredArticles.map(a => ({ id: a.id, title: a.title, isFeatured: a.isFeatured })));

        return {
            featuredArticles,
            lang: params.lang
        };
    } catch (error) {
        console.error('Error loading featured articles:', error);
        return {
            featuredArticles: [],
            lang: params.lang
        };
    }
};
