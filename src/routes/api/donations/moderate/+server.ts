import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDonations, approveDonation, rejectDonation, getDonationById, getUsers } from '$db/queries';

// Get pending donations for moderation
export const GET: RequestHandler = async ({ url, locals }) => {
    try {
        const user = (locals as any).user;
        
        // Check if user is moderator or admin
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }
        
        const statusParam = url.searchParams.get('status');
        const status = statusParam === 'all' ? undefined : (statusParam || 'pending');
        const limit = parseInt(url.searchParams.get('limit') || '100');
        
        const donations = await getDonations({ status, limit });
        
        // Get user information for each donation
        const userIds = donations
          .filter(d => d.user_id)
          .map(d => d.user_id);
        
        let users: any[] = [];
        if (userIds.length > 0) {
          users = await getUsers({ userIds });
        }
        
        // Combine donation with user info
        const donationsWithUsers = donations.map(donation => ({
          ...donation,
          donor_username: users.find(u => u.id === donation.user_id)?.username,
          donor_avatar: users.find(u => u.id === donation.user_id)?.avatar_url,
          donor_name: users.find(u => u.id === donation.user_id)?.name,
          donor_surname: users.find(u => u.id === donation.user_id)?.surname
        }));
        
        return json({ donations: donationsWithUsers });
    } catch (error) {
        return json({ error: 'Bağışlar yüklenirken bir hata oluştu' }, { status: 500 });
    }
};

// Approve or reject donation
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const user = (locals as any).user;
        
        // Check if user is moderator or admin
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }
        
        const body = await request.json();
        const { action, donationId, rejectionReason } = body;
        
        if (!action || !donationId) {
            return json({ error: 'Eksik parametreler' }, { status: 400 });
        }
        
        const donation = await getDonationById(donationId);
        if (!donation) {
            return json({ error: 'Bağış bulunamadı' }, { status: 404 });
        }
        
        if (action === 'approve') {
            await approveDonation(donationId, user.id);
            return json({ success: true, message: 'Bağış onaylandı' });
        } else if (action === 'reject') {
            await rejectDonation(donationId, user.id, rejectionReason);
            return json({ success: true, message: 'Bağış reddedildi' });
        } else {
            return json({ error: 'Geçersiz işlem' }, { status: 400 });
        }
    } catch (error) {
        return json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
    }
};
