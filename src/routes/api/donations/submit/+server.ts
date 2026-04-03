import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDonation, getUsers } from '$db/queries';
import { notifyAdminsNewDonation } from '$lib/server/notifications-pg';

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const user = (locals as any).user;
        
        const body = await request.json();
        const { amount, txid, donation_date, message, display_name, user_id: body_user_id } = body;
        
        // Validation
        if (!amount || !txid || !donation_date) {
            return json({ error: 'Tutar, TXID ve tarih alanları zorunludur' }, { status: 400 });
        }
        
        // TXID validation - Monero TXID should be 64 hex characters
        const TXID_REGEX = /^[a-fA-F0-9]{64}$/;
        if (!TXID_REGEX.test(txid.trim())) {
            return json({ error: 'Geçersiz TXID formatı. Monero TXID 64 karakterli hex kodu olmalıdır' }, { status: 400 });
        }
        
        if (message && message.trim().length > 150) {
            return json({ error: 'Mesaj en fazla 150 karakter olabilir' }, { status: 400 });
        }
        
        if (parseFloat(amount) <= 0) {
            return json({ error: 'Bağış tutarı sıfırdan büyük olmalıdır' }, { status: 400 });
        }
        
        // Create donation with pending status
        const donation = await createDonation({
            user_id: body_user_id || user?.id || null,
            amount: parseFloat(amount),
            txid: txid.trim(),
            donation_date: new Date(donation_date),
            message: message?.trim() || null,
            display_name: display_name?.trim() || null
        });

        // Send notification to admins about new donation
        try {
            await notifyAdminsNewDonation({
                donationId: donation.id,
                amount: parseFloat(amount),
                donorId: body_user_id || user?.id || null,
                donorName: display_name?.trim() || null,
                message: message?.trim() || null
            });
        } catch (notificationError) {
            // Don't fail the request if notification fails
        }
        
        return json({ 
            success: true, 
            donation: {
                id: donation.id,
                amount: donation.amount,
                status: donation.status
            }
        });
    } catch (error) {
        return json({ error: 'Bağış kaydedilirken bir hata oluştu' }, { status: 500 });
    }
};
