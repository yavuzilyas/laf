import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { deleteDonation } from '$db/queries';

// Delete a donation
export const DELETE: RequestHandler = async ({ params, locals }) => {
    try {
        const user = (locals as any).user;
        
        // Check if user is moderator or admin
        if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
            return json({ error: 'Yetkisiz erişim' }, { status: 403 });
        }
        
        const donationId = params.id;
        if (!donationId) {
            return json({ error: 'Bağış ID gerekli' }, { status: 400 });
        }
        
        // Delete the donation
        const result = await deleteDonation(donationId);
        
        if (!result) {
            return json({ error: 'Bağış bulunamadı' }, { status: 404 });
        }
        
        return json({ success: true, message: 'Bağış başarıyla silindi' });
    } catch (error) {
        return json({ error: 'Bağış silinirken bir hata oluştu' }, { status: 500 });
    }
};
