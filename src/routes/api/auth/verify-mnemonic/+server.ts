import { json } from '@sveltejs/kit';
import { getUsers, updateUserAuthFields } from '$db/queries';
import pkg from 'argon2';
const { verify } = pkg;

// Rate limiting configuration
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

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
    
    if (user.mnemonic_attempts >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - attemptWindow) / 1000);
      return json({
        error: `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(retryAfter / 60)} dakika sonra tekrar deneyin.`,
        reset: true
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

    const { mnemonicPhrase, verificationToken } = requestData;
    
    if (!mnemonicPhrase || typeof mnemonicPhrase !== 'string' || !verificationToken) {
      return json({ error: 'Eksik veya geçersiz istek parametreleri' }, { status: 400 });
    }
    
    if (!user.mnemonic_hash || typeof user.mnemonic_hash !== 'string') {
      return json({ error: 'Mnemonic bulunamadı' }, { status: 404 });
    }

    // Check verification token
    if (user.verification_token !== verificationToken) {
      // Increment failed attempt
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });
      
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      const error = remainingAttempts > 0 
        ? `Yanlış mnemonic kelimesi. Kalan deneme hakkınız: ${remainingAttempts}`
        : 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      
      return json({ 
        error,
        reset: remainingAttempts <= 0
      }, { status: 400 });
    }

    const normalizedMnemonic = mnemonicPhrase.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
    const words = normalizedMnemonic ? normalizedMnemonic.split(' ') : [];
    if (words.length !== 12) {
      return json({ error: 'Geçersiz mnemonic formatı' }, { status: 400 });
    }

    // Verify mnemonic using argon2
    const isMatch = await verify(user.mnemonic_hash, normalizedMnemonic);

    if (!isMatch) {
      // Increment failed attempt
      await updateUserAuthFields(user.id, {
        last_mnemonic_attempt: now,
        mnemonic_attempts: (user.mnemonic_attempts || 0) + 1
      });
      
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonic_attempts || 0) - 1);
      const error = remainingAttempts > 0 
        ? `Yanlış mnemonic kelimesi. Kalan deneme hakkınız: ${remainingAttempts}`
        : 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      
      return json({ 
        error,
        reset: remainingAttempts <= 0
      }, { status: 400 });
    }

    // Generate a new verification token for the next action
    const newVerificationToken = crypto.randomUUID();
    
    // Store the verification token in the user's session and reset attempts
    try {
      await updateUserAuthFields(user.id, {
        verification_token: newVerificationToken,
        verification_token_expires_at: new Date(Date.now() + (5 * 60 * 1000)), // 5 minutes
        last_mnemonic_attempt: null,
        mnemonic_attempts: 0
      });
    } catch (err) {
      console.error('Error updating user token:', err);
      // Continue anyway since the verification was successful
    }

    return json({ 
      success: true, 
      verificationToken: newVerificationToken,
      message: 'Doğrulama başarılı' 
    });
  } catch (error) {
    console.error('Mnemonic verification error:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('invalid input syntax for uuid')) {
        return json({ 
          error: 'Geçersiz kullanıcı kimliği' 
        }, { status: 400 });
      }
      
      if (error.message.includes('connection')) {
        return json({ 
          error: 'Veritabanı hatası. Lütfen daha sonra tekrar deneyin.' 
        }, { status: 503 });
      }
    }
    
    return json({ 
      error: 'Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.' 
    }, { 
      status: 500,
      headers: {
        'Retry-After': '30' // Suggest retry after 30 seconds
      }
    });
  }
}