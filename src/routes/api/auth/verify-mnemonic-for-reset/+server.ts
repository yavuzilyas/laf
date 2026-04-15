import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers, updateUserAuthFields } from '$db/queries';
import pkg from 'argon2';
const { verify } = pkg;

// Rate limiting configuration
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// 5 minute expiration for verification tokens
const VERIFICATION_TOKEN_EXPIRY = 5 * 60 * 1000;

// Helper function for timing-safe comparison
function safeCompare(a: string, b: string): boolean {
  const aBuffer = new TextEncoder().encode(a);
  const bBuffer = new TextEncoder().encode(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBuffer.length; i++) {
    result |= aBuffer[i] ^ bBuffer[i];
  }
  return result === 0;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const now = new Date();

    const { userId, mnemonicPhrase, verificationToken } = await request.json();

    // Input validation
    if (!userId || !mnemonicPhrase || !verificationToken) {
      return json({ error: 'Eksik parametreler' }, { status: 400 });
    }

    // Get user
    const users = await getUsers({ id: userId });
    const user = users[0];

    if (!user) {
      return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

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

    // Check verification token
    if (!user.verification_token || !safeCompare(user.verification_token, verificationToken)) {
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      return json({
        error: 'Geçersiz doğrulama tokenı',
        remainingAttempts,
        maxAttempts: MAX_ATTEMPTS,
        reset: remainingAttempts <= 0
      }, { status: 400 });
    }

    // Check token expiry
    if (user.verification_token_expires_at && new Date(user.verification_token_expires_at).getTime() < now.getTime()) {
      await updateUserAuthFields(user.id, {
        verification_token: null,
        verification_token_expires_at: null,
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });

      return json({
        error: 'Doğrulama tokenı süresi doldu. Lütfen tekrar başlayın.',
        reset: true
      }, { status: 400 });
    }

    // Validate mnemonic format
    const normalizedMnemonic = mnemonicPhrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
    const words = normalizedMnemonic ? normalizedMnemonic.split(' ') : [];

    if (words.length !== 12) {
      return json({
        error: 'Mnemonic 12 kelime olmalıdır',
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0))
      }, { status: 400 });
    }

    // Verify mnemonic using argon2
    const isMatch = await verify(user.mnemonic_hash, normalizedMnemonic);

    if (!isMatch) {
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });

      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      return json({
        error: remainingAttempts > 0
          ? `Yanlış mnemonic. Kalan deneme hakkınız: ${remainingAttempts}`
          : 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.',
        remainingAttempts,
        maxAttempts: MAX_ATTEMPTS,
        reset: remainingAttempts <= 0
      }, { status: 400 });
    }

    // Generate new verification token for password reset
    const newVerificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    // Reset attempts and store new token
    await updateUserAuthFields(user.id, {
      verification_token: newVerificationToken,
      verification_token_expires_at: tokenExpiry,
      last_mnemonic_attempt: null,
      mnemonic_attempts: 0
    });

    return json({
      success: true,
      message: 'Mnemonic doğrulandı. Şimdi yeni şifrenizi girebilirsiniz.',
      verificationToken: newVerificationToken
    });

  } catch (error) {
    return json({ error: 'Doğrulama sırasında bir hata oluştu' }, { status: 500 });
  }
};
