import type { PageServerLoad } from './$types';
import { getLinks } from '$db/queries-links';

export const load: PageServerLoad = async () => {
    try {
        const links = await getLinks({ isActive: true });
        
        // Group links by type
        const groupedLinks = links.reduce((acc, link) => {
            const type = link.type || 'other';
            if (!acc[type]) acc[type] = [];
            acc[type].push(link);
            return acc;
        }, {} as Record<string, typeof links>);

        return {
            links,
            groupedLinks
        };
    } catch (error) {
        console.error('Error loading links:', error);
        return {
            links: [],
            groupedLinks: {}
        };
    }
};
