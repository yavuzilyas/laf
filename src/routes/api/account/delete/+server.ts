import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function DELETE({ cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ errorKey: 'auth.errors.unauthorized' }, { status: 401 });
  }

  try {
    const users = await getUsersCollection();
    const result = await users.deleteOne({ _id: new ObjectId(session) });
    
    if (result.deletedCount === 0) {
      return json({ errorKey: 'auth.errors.userNotFound' }, { status: 404 });
    }

    // Session cookie'sini temizle
    cookies.delete('session', { path: '/' });
    
    return json({ success: true, successKey: 'auth.success.accountDeleted' });
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    return json({ errorKey: 'auth.errors.serverError' }, { status: 500 });
  }
}