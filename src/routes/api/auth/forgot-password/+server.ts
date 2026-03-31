import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByIdentifier, updateUserAuthFields } from '$db/queries';

// Rate limiting configuration
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// 5 minute expiration for verification tokens
const VERIFICATION_TOKEN_EXPIRY = 5 * 60 * 1000;

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { identifier } = await request.json();

    if (!identifier || typeof identifier !== 'string') {
      return json({ error: 'Kullanıcı adı veya e-posta gerekli' }, { status: 400 });
    }

    // Get user by identifier (username or email)
    const user = await getUserByIdentifier(identifier);

    if (!user) {
      // Return same error to prevent user enumeration
      return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Check if user has mnemonic
    if (!user.mnemonic_hash) {
      return json({ error: 'Bu hesap için mnemonic bulunamadı' }, { status: 400 });
    }

    const now = new Date();

    // Check rate limit
    const lastAttempt = user.last_mnemonic_attempt ? new Date(user.last_mnemonic_attempt) : null;
    const attemptWindow = lastAttempt ? now.getTime() - lastAttempt.getTime() : RATE_LIMIT_WINDOW + 1;

    if ((user.mnemonic_attempts || 0) >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - attemptWindow) / 1000);
      return json({
        error: `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(retryAfter / 60)} dakika sonra tekrar deneyin.`,
        reset: true
      }, {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString()
        }
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    // Store verification token and increment attempt
    await updateUserAuthFields(user.id, {
      verification_token: verificationToken,
      verification_token_expires_at: tokenExpiry,
      last_mnemonic_attempt: now,
      mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
    });

    // Calculate remaining attempts
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);

    return json({
      success: true,
      message: 'Mnemonic doğrulaması gerekli',
      userId: user.id,
      verificationToken,
      remainingAttempts,
      expiresIn: VERIFICATION_TOKEN_EXPIRY / 1000
    });

  } catch (error) {
    return json({ error: 'İşlem sırasında bir hata oluştu' }, { status: 500 });
  }
};
