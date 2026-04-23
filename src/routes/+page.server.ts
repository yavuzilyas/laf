import type { PageServerLoad } from './$types';
import { getFeaturedArticles } from '$db/queries';

export const load: PageServerLoad = async ({ locals }) => {
    // Use default locale without redirect - serves content directly at root
    const locale = locals.locale || 'tr';

    try {
        const featuredArticles = await getFeaturedArticles(3, undefined, locale);

        // Debug logging
        console.log('[DEBUG] Root - Featured articles count:', featuredArticles.length);
        console.log('[DEBUG] Root - User:', locals.user?.username || 'anonymous', 'Role:', locals.user?.role || 'none');
        console.log('[DEBUG] Root - Featured articles:', featuredArticles.map(a => ({ id: a.id, title: a.title, isFeatured: a.isFeatured })));

        return {
            featuredArticles,
            lang: locale
        };
    } catch (error) {
        console.error('Error loading featured articles:', error);
        return {
            featuredArticles: [],
            lang: locale
        };
    }
};
