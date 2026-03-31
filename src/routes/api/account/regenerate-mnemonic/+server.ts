import { json } from '@sveltejs/kit';
import { getUsers, updateUserAuthFields } from '$db/queries';
import { generateMnemonic } from '$lib/utils/mnemonic';

export async function POST({ request, cookies }) {
  try {
    const session = cookies.get('session');
    if (!session) {
      return json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });
    }

    // Get verification token from headers
    const verificationToken = request.headers.get('X-Verification-Token');
    if (!verificationToken) {
      return json({ error: 'Doğrulama token\'ı gerekli' }, { status: 400 });
    }

    // Get user and verify token
    const users = await getUsers({ id: session, status: { $ne: 'suspended' } });
    const user = users[0];
    
    if (!user) {
      return json({ error: 'Kullanıcı bulunamadı veya erişim engellendi' }, { status: 404 });
    }

    // Check verification token
    if (user.verification_token !== verificationToken) {
      return json({ error: 'Geçersiz doğrulama token\'ı' }, { status: 400 });
    }

    // Check if token is expired
    if (user.verification_token_expires_at) {
      const expiresAt = new Date(user.verification_token_expires_at);
      if (new Date() > expiresAt) {
        return json({ error: 'Doğrulama token\'ının süresi dolmuş' }, { status: 400 });
      }
    }

    // Generate new mnemonic
    const newMnemonic = generateMnemonic();
    
    // Hash the new mnemonic (you'll need to implement this)
    const { hash } = await import('argon2');
    const mnemonicHash = await hash(newMnemonic);

    // Update user with new mnemonic and clear verification token
    await updateUserAuthFields(user.id, {
      mnemonic_hash: mnemonicHash,
      verification_token: null,
      verification_token_expires_at: null,
      last_mnemonic_attempt: null,
      mnemonic_attempts: 0
    });

    return json({ 
      success: true, 
      mnemonic: newMnemonic,
      message: 'Mnemonic başarıyla yenilendi' 
    });
  } catch (error) {
    
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
      error: 'Mnemonic yenilenirken bir hata oluştu. Lütfen tekrar deneyin.' 
    }, { 
      status: 500,
      headers: {
        'Retry-After': '30'
      }
    });
  }
}
