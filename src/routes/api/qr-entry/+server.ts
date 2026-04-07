import { json } from '@sveltejs/kit';
import { recordQrEntry, getQrEntries, getQrEntryStats } from '$db/queries';

export async function POST({ request, locals }: any) {
    try {
        const body = await request.json();
        const { sourceUrl } = body;
        
        if (!sourceUrl) {
            return json({ success: false, error: 'Source URL required' }, { status: 400 });
        }
        
        // Get username from locals if logged in
        const username = locals.user?.username || locals.user?.nickname || null;
        
        // Get user agent
        const userAgent = request.headers.get('user-agent');
        
        // Record the QR entry
        await recordQrEntry({
            username,
            sourceUrl,
            userAgent
        });
        
        return json({ success: true });
    } catch (error) {
        console.error('Error recording QR entry:', error);
        return json({ success: false, error: 'Failed to record QR entry' }, { status: 500 });
    }
}

export async function GET({ url, locals }: any) {
    try {
        // Check if user is admin or moderator
        if (!locals.user || !['admin', 'moderator'].includes(locals.user.role)) {
            return json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }
        
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const fromDate = url.searchParams.get('fromDate');
        const toDate = url.searchParams.get('toDate');
        
        // Get entries with pagination
        const entries = await getQrEntries({
            limit,
            offset,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined
        });
        
        // Get stats for the same period
        const stats = await getQrEntryStats(
            fromDate ? new Date(fromDate) : undefined,
            toDate ? new Date(toDate) : undefined
        );
        
        return json({ 
            success: true, 
            entries,
            stats
        });
    } catch (error) {
        console.error('Error fetching QR entries:', error);
        return json({ success: false, error: 'Failed to fetch QR entries' }, { status: 500 });
    }
}
