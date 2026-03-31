import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers, updateUserAuthFields } from '$db/queries';
import pkg from 'argon2';
const { hash } = pkg;

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

    const { userId, verificationToken, newPassword } = await request.json();

    // Input validation
    if (!userId || !verificationToken || !newPassword) {
      return json({ error: 'Tüm alanlar zorunludur' }, { status: 400 });
    }

    // Validate password policy
    if (newPassword.length < 8) {
      return json({ error: 'Şifre en az 8 karakter olmalıdır' }, { status: 400 });
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return json({ error: 'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir' }, { status: 400 });
    }

    // Get user
    const users = await getUsers({ id: userId });
    const user = users[0];

    if (!user) {
      return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Check verification token
    if (!user.verification_token || !safeCompare(user.verification_token, verificationToken)) {
      return json({ error: 'Geçersiz doğrulama tokenı' }, { status: 400 });
    }

    // Check token expiry
    if (user.verification_token_expires_at && new Date(user.verification_token_expires_at).getTime() < now.getTime()) {
      return json({ error: 'Doğrulama tokenı süresi doldu. Lütfen tekrar başlayın.' }, { status: 400 });
    }

    // Hash new password with argon2
    const newPasswordHash = await hash(newPassword);

    // Update password and clear verification token
    await updateUserAuthFields(user.id, {
      password_hash: newPasswordHash,
      verification_token: null,
      verification_token_expires_at: null,
      last_mnemonic_attempt: null,
      mnemonic_attempts: 0
    });

    return json({
      success: true,
      message: 'Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return json({ error: 'Şifre değiştirme sırasında bir hata oluştu' }, { status: 500 });
  }
};
