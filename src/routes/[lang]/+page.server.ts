import type { PageServerLoad } from './$types';
import { getFeaturedArticles } from '$db/queries';

export const load: PageServerLoad = async ({ params }) => {
    try {
        const currentLocale = params.lang || 'tr';
        const featuredArticles = await getFeaturedArticles(3, undefined, currentLocale);

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
