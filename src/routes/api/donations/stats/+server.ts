import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDonationsStats } from '$db/queries';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const groupBy = (url.searchParams.get('groupBy') || 'day') as 'day' | 'month' | 'year' | 'week';
        const from_date = url.searchParams.get('from_date') || undefined;
        const to_date = url.searchParams.get('to_date') || undefined;
        
        const filters: any = {};
        if (from_date) filters.from_date = new Date(from_date);
        if (to_date) filters.to_date = new Date(to_date);
        
        const stats = await getDonationsStats(groupBy, filters);
        
        // Format for chart
        const chartData = stats.map((s: any) => ({
            date: s.period,
            amount: parseFloat(s.total),
            count: parseInt(s.count)
        }));
        
        return json({ stats: chartData });
    } catch (error) {
        return json({ error: 'İstatistikler yüklenirken bir hata oluştu' }, { status: 500 });
    }
};
