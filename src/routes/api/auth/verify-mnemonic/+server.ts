import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

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
    const users = await getUsersCollection();
    const now = new Date();
    
    const session = cookies.get('session');
    if (!session) {
      return json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }

    // Get user and check rate limit
    let user;
    try {
      user = await users.findOne({
        _id: new ObjectId(session),
        status: { $ne: 'suspended' }
      });
    } catch (err) {
      console.error('Error finding user:', err);
      return json({ 
        error: 'Kullanıcı bilgileri alınırken bir hata oluştu' 
      }, { status: 500 });
    }
    
    if (!user) {
      return json({ error: 'Kullanıcı bulunamadı veya erişim engellendi' }, { status: 404 });
    }
    
    // Check rate limit from user document
    const lastAttempt = user.lastMnemonicAttempt ? new Date(user.lastMnemonicAttempt) : null;
    const attemptWindow = lastAttempt ? now.getTime() - lastAttempt.getTime() : RATE_LIMIT_WINDOW + 1;
    
    if (user.mnemonicAttempts >= MAX_ATTEMPTS && attemptWindow < RATE_LIMIT_WINDOW) {
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

    const { index, word, verificationToken } = requestData;
    
    if (typeof index !== 'number' || index < 0 || !word || !verificationToken) {
      return json({ error: 'Eksik veya geçersiz istek parametreleri' }, { status: 400 });
    }
    
    if (!user.mnemonicHashes?.length) {
      return json({ error: 'Mnemonic bulunamadı' }, { status: 404 });
    }
    
    if (index >= user.mnemonicHashes.length) {
      return json({ error: 'Geçersiz mnemonic indeksi' }, { status: 400 });
    }

    // Check verification token
    if (user.verificationToken !== verificationToken) {
      // Increment failed attempt
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { lastMnemonicAttempt: now },
          $inc: { mnemonicAttempts: 1 }
        }
      );
      
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonicAttempts || 0) - 1);
      const error = remainingAttempts > 0 
        ? `Yanlış mnemonic kelimesi. Kalan deneme hakkınız: ${remainingAttempts}`
        : 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      
      return json({ 
        error,
        reset: remainingAttempts <= 0
      }, { status: 400 });
    }

    // Hash calculation with timing-safe comparison
    const encoder = new TextEncoder();
    const inputHash = await crypto.subtle.digest('SHA-256', encoder.encode(word.trim().toLowerCase()));
    const hashArray = Array.from(new Uint8Array(inputHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const isMatch = safeCompare(hashHex, user.mnemonicHashes[index]);

    if (!isMatch) {
      // Increment failed attempt
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { lastMnemonicAttempt: now },
          $inc: { mnemonicAttempts: 1 }
        }
      );
      
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (user.mnemonicAttempts || 0) - 1);
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
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            verificationToken: newVerificationToken,
            verificationTokenExpiresAt: new Date(Date.now() + (5 * 60 * 1000)) // 5 minutes
          },
          $unset: {
            lastMnemonicAttempt: 1,
            mnemonicAttempts: 1
          }
        }
      );
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
      if (error.name === 'BSONError') {
        return json({ 
          error: 'Geçersiz kullanıcı kimliği' 
        }, { status: 400 });
      }
      
      if (error.name === 'MongoServerError') {
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