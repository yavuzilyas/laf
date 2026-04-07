import type { PageServerLoad } from './$types';
import { getPopularArticles } from '$db/queries';

export const load: PageServerLoad = async ({ locals }) => {
    // Use default locale without redirect - serves content directly at root
    const locale = locals.locale || 'tr';
    
    try {
        const popularArticles = await getPopularArticles(3);
        
        return {
            popularArticles,
            lang: locale
        };
    } catch (error) {
        console.error('Error loading popular articles:', error);
        return {
            popularArticles: [],
            lang: locale
        };
    }
};
