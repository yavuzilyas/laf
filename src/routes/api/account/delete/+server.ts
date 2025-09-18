import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function DELETE({ cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const users = await getUsersCollection();
    const result = await users.deleteOne({ _id: new ObjectId(session) });
    
    if (result.deletedCount === 0) {
      return json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Session cookie'sini temizle
    cookies.delete('session', { path: '/' });
    
    return json({ success: true });
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    return json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}