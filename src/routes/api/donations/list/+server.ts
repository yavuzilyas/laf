import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDonations, getTopDonors, getDonationsTotal, getDonationsCount, getUsers } from '$db/queries';
import { getUserBadges } from '$lib/server/badges';

export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        const user = (locals as any).user;
        const status = url.searchParams.get('status') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const from_date = url.searchParams.get('from_date') || undefined;
        const to_date = url.searchParams.get('to_date') || undefined;
        const user_id = url.searchParams.get('user_id') || undefined;
        
        const filters: any = { limit, offset };
        if (status) filters.status = status;
        if (from_date) filters.from_date = new Date(from_date);
        if (to_date) filters.to_date = new Date(to_date);
        if (user_id) filters.user_id = user_id;
        
        const donations = await getDonations(filters);
        const total = await getDonationsTotal({ from_date, to_date });
        const count = await getDonationsCount({ status, from_date, to_date });
        const topDonors = await getTopDonors(10);
        
        // Combine donation with user info from getDonations
        const donationsWithUsers = await Promise.all(donations.map(async donation => {
            let badges = [];
            if (donation.user_id) {
                badges = await getUserBadges(donation.user_id);
            }
            
            return {
                id: donation.id,
                amount: donation.amount,
                message: donation.message,
                display_name: donation.display_name || 'Anonim',
                donation_date: donation.donation_date,
                status: donation.status,
                user_id: donation.user_id,
                username: donation.username,
                user_name: donation.user_name,
                user_surname: donation.user_surname,
                donor_username: donation.donor_username,
                donor_name: donation.donor_name,
                donor_surname: donation.donor_surname,
                donor_avatar: donation.donor_avatar,
                badges
            };
        }));
        
        const topDonorsWithUsers = await Promise.all(topDonors.map(async donor => {
            let badges = [];
            if (donor.user_id) {
                badges = await getUserBadges(donor.user_id);
            }
            
            return {
                ...donor,
                username: donor.username,
                user_name: donor.user_name,
                user_surname: donor.user_surname,
                donor_username: donor.donor_username,
                donor_name: donor.donor_name,
                donor_surname: donor.donor_surname,
                donor_avatar: donor.donor_avatar,
                badges
            };
        }));
        
        return json({
            donations: donationsWithUsers,
            total,
            count,
            topDonors: topDonorsWithUsers
        });
    } catch (error) {
        return json({ error: 'Bağışlar yüklenirken bir hata oluştu' }, { status: 500 });
    }
};
