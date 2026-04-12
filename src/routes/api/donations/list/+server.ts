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

        // Get unique reviewed_by IDs for reviewer info
        const reviewedByIds = Array.from(
            new Set(
                donations
                    .map((d: any) => d.reviewed_by)
                    .filter((id: any): id is string => Boolean(id))
            )
        );

        // Fetch reviewers info
        const reviewersMap = new Map<
            string,
            { id: string; username: string | null; nickname: string | null; name: string | null; surname: string | null; role: string | null }
        >();

        if (reviewedByIds.length > 0) {
            for (const reviewerId of reviewedByIds) {
                const reviewerData = await getUsers({ id: reviewerId });
                const reviewer = reviewerData[0];
                if (reviewer) {
                    reviewersMap.set(reviewer.id, {
                        id: reviewer.id,
                        username: reviewer.username || null,
                        nickname: reviewer.nickname || null,
                        name: reviewer.name || null,
                        surname: reviewer.surname || null,
                        role: reviewer.role || null
                    });
                }
            }
        }

        // Combine donation with user info from getDonations
        const donationsWithUsers = await Promise.all(donations.map(async (donation: any) => {
            const badges: any[] = [];
            if (donation.user_id) {
                const userBadges = await getUserBadges(donation.user_id);
                badges.push(...userBadges);
            }

            const reviewer = donation.reviewed_by ? reviewersMap.get(donation.reviewed_by) : null;

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
                updatedAt: donation.updated_at ?? null,
                reviewedBy: reviewer ? {
                    id: reviewer.id,
                    username: reviewer.username,
                    nickname: reviewer.nickname,
                    name: reviewer.name,
                    surname: reviewer.surname,
                    role: reviewer.role
                } : null,
                reviewedAt: donation.reviewed_at ?? null,
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
