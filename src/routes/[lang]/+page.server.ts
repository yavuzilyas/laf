import type { PageServerLoad } from './$types';
import { getPopularArticles } from '$db/queries';

export const load: PageServerLoad = async ({ params }) => {
    try {
        const currentLocale = params.lang || 'tr';
        const popularArticles = await getPopularArticles(3, undefined, currentLocale);
        
        return {
            popularArticles,
            lang: params.lang
        };
    } catch (error) {
        console.error('Error loading popular articles:', error);
        return {
            popularArticles: [],
            lang: params.lang
        };
    }
};
