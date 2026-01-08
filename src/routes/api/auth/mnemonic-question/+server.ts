import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';
import type { RequestHandler } from './$types';

// 5 minute expiration for verification tokens
const VERIFICATION_TOKEN_EXPIRY = 5 * 60 * 1000;

// Rate limiting configuration
const MAX_ATTEMPTS = 5;
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

export const POST = async ({ request, cookies }) => {
  const users = await getUsersCollection();
  const now = new Date();
  
  try {

    // Get and validate session
    const session = cookies.get('session');
    if (!session) {
      return json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }
    
    // Get user and check rate limit
    const user = await users.findOne({
      _id: new ObjectId(session),
      status: { $ne: 'suspended' }
    });
    
    if (!user) {
      return json({ error: 'Kullanıcı bulunamadı veya erişim engellendi' }, { status: 404 });
    }
    
    // Check rate limit from user document
    const lastAttempt = user.lastMnemonicAttempt ? new Date(user.lastMnemonicAttempt) : null;
    const attemptWindow = lastAttempt ? now.getTime() - lastAttempt.getTime() : RATE_LIMIT_WINDOW + 1;
    
    if (user.mnemonicAttempts >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
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

    const { verificationToken } = requestData;
    if (!verificationToken || typeof verificationToken !== 'string') {
      return json({ error: 'Geçersiz doğrulama tokenı' }, { status: 400 });
    }

    if (!user.mnemonicHashes?.length) {
      return json({ error: 'Mnemonic bulunamadı' }, { status: 404 });
    }

    // Generate a secure random index
    const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * user.mnemonicHashes.length);
    
    // Create a new verification token with expiration
    const newVerificationToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);
    
    // Store the verification token with expiration and update rate limit
    await users.updateOne(
      { _id: user._id },
      [
        {
          $set: {
            verificationToken: newVerificationToken,
            verificationTokenExpiresAt: tokenExpiry,
            lastMnemonicAttempt: now,
            mnemonicAttempts: { 
              $cond: [
                { $ifNull: ['$mnemonicAttempts', false] },
                { $add: ['$mnemonicAttempts', 1] },
                1
              ]
            }
          }
        },
        {
          $unset: 'verificationAttempts'
        }
      ]
    );
    
    // Return minimal required information
    return json({ 
      index: randomIndex,
      verificationToken: newVerificationToken,
      expiresIn: VERIFICATION_TOKEN_EXPIRY / 1000 // in seconds
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Mnemonic question error:', error);
    // Don't leak internal error details to the client
    return json({ 
      error: 'İşlem sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' 
    }, { 
      status: 500,
      headers: {
        'Retry-After': '30' // Suggest retry after 30 seconds
      }
    });
  }
}