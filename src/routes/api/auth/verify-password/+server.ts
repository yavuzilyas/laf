import { json } from '@sveltejs/kit';
import { getUsers, updateUserAuthFields } from '$db/queries';
import pkg from 'argon2';
const { verify } = pkg;
import type { RequestHandler } from './$types';

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function POST({ request, cookies }) {
    try {
        const now = new Date();
        
        const session = cookies.get('session');
        if (!session) {
            return json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
        }

        // Get user and check rate limit
        const users = await getUsers({ id: session, status: { $ne: 'suspended' } });
        const user = users[0];
        
        if (!user) {
            return json({ error: 'Kullanıcı bulunamadı veya erişim engellendi' }, { status: 404 });
        }
        
        // Check rate limit from user document
        const lastAttempt = user.last_mnemonic_attempt ? new Date(user.last_mnemonic_attempt) : null;
        const attemptWindow = lastAttempt ? now.getTime() - lastAttempt.getTime() : RATE_LIMIT_WINDOW + 1;
        
        // Reset attempts if time window has passed
        if (user.mnemonic_attempts >= MAX_ATTEMPTS && attemptWindow >= RATE_LIMIT_WINDOW) {
            await updateUserAuthFields(user.id, {
                last_mnemonic_attempt: null,
                mnemonic_attempts: 0
            });
            user.mnemonic_attempts = 0;
        }
        
        if (user.mnemonic_attempts >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
            const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - attemptWindow) / 1000);
            return json({
                error: `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(retryAfter / 60)} dakika sonra tekrar deneyin.`
            }, {
                status: 429,
                headers: {
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': MAX_ATTEMPTS.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': (lastAttempt.getTime() + RATE_LIMIT_WINDOW).toString()
                }
            });
        }

        // Input validation
        let requestData;
        try {
            requestData = await request.json();
        } catch (e) {
            return json({ error: 'Geçersiz istek formatı' }, { status: 400 });
        }

        const { password } = requestData;
        
        if (!password || typeof password !== 'string') {
            return json({ error: 'Şifre gerekli' }, { status: 400 });
        }

        // Verify password using argon2
        const isMatch = await verify(user.password_hash, password);

        if (!isMatch) {
            // Increment failed attempt
            await updateUserAuthFields(user.id, {
                last_mnemonic_attempt: now,
                mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
            });
            
            const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
            const error = remainingAttempts > 0 
                ? `Yanlış şifre. Kalan deneme hakkınız: ${remainingAttempts}`
                : 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
            
            return json({ 
                error,
                reset: remainingAttempts <= 0
            }, { status: 400 });
        }

        // Generate a new verification token for the next action
        const newVerificationToken = crypto.randomUUID();
        
        // Reset attempts and set verification token
        await updateUserAuthFields(user.id, {
            verification_token: newVerificationToken,
            verification_token_expires_at: new Date(Date.now() + (5 * 60 * 1000)), // 5 minutes
            last_mnemonic_attempt: null,
            mnemonic_attempts: 0
        });

        return json({ 
            success: true, 
            verificationToken: newVerificationToken,
            message: 'Şifre doğrulaması başarılı' 
        });
    } catch (error) {
        return json({ 
            error: 'Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.' 
        }, { 
            status: 500,
            headers: {
                'Retry-After': '30'
            }
        });
    }
}
