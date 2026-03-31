import type { PageServerLoad } from './$types';
import { getPopularArticles } from '$db/queries';

export const load: PageServerLoad = async () => {
    try {
        const popularArticles = await getPopularArticles(3);
        
        return {
            popularArticles
        };
    } catch (error) {
        console.error('Error loading popular articles:', error);
        return {
            popularArticles: []
        };
    }
};
