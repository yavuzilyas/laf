import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
    // Redirect to locale-prefixed URL
    const locale = locals.locale || 'tr';
    const path = url.pathname === '/' ? '' : url.pathname;
    const search = url.search;
    
    throw redirect(302, `/${locale}${path}${search}`);
};
