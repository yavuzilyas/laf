import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDonations, getUsers } from '$db/queries';
import { getUserBadges } from '$lib/server/badges';
import type { BadgeType } from '$lib/types/badges';

export const GET: RequestHandler = async ({ url }) => {
    try {
        const badgeType = url.searchParams.get('type') as BadgeType | null;
        const limit = parseInt(url.searchParams.get('limit') || '50');
        
        if (!badgeType) {
            return json({ error: 'Badge type is required' }, { status: 400 });
        }
        
        // Get all approved donations with user info
        const donations = await getDonations({ 
            status: 'approved',
            limit: 1000 // Get more to find all badge holders
        });
        
        // Get unique users from donations
        const userIds = [...new Set(donations.map(d => d.user_id).filter(Boolean))];
        
        // Calculate badges for each user and filter by badge type
        const badgeHolders = [];
        
        for (const userId of userIds.slice(0, limit)) {
            const badges = await getUserBadges(userId);
            const hasBadge = badges.some(b => b.type === badgeType);
            
            if (hasBadge) {
                // Get user info
                const user = await getUsers({ id: userId });
                if (user && user.length > 0) {
                    // Calculate total donation for this user
                    const userDonations = donations.filter(d => d.user_id === userId);
                    const totalAmount = userDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
                    
                    badgeHolders.push({
                        userId,
                        username: user[0].username,
                        name: user[0].name,
                        surname: user[0].surname,
                        avatar_url: user[0].avatar_url,
                        totalAmount: totalAmount.toFixed(6),
                        donationCount: userDonations.length
                    });
                }
            }
        }
        
        // Sort by total amount descending
        badgeHolders.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
        
        return json({
            badgeType,
            users: badgeHolders.slice(0, limit),
            total: badgeHolders.length
        });
        
    } catch (error) {
        console.error('Badge holders fetch error:', error);
        return json({ error: 'Failed to fetch badge holders' }, { status: 500 });
    }
};
