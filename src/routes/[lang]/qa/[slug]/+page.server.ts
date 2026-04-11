import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
    const { slug } = params;
    const user = (locals as any)?.user ?? null;

    try {
        // Fetch question from API
        const response = await fetch(`/api/qa/${slug}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw error(response.status, errorData.error || 'Soru yüklenirken hata oluştu');
        }

        const data = await response.json();

        if (!data.question) {
            throw error(404, 'Soru bulunamadı');
        }

        return {
            question: data.question,
            answers: data.answers || [],
            userReaction: data.userReaction || null,
            isModerator: data.isModerator || false,
            user
        };
    } catch (err: any) {
        console.error('Error loading question page:', err);
        throw error(500, 'Soru yüklenirken bir hata oluştu');
    }
};
