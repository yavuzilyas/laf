import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function GET({ cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ errorKey: 'auth.errors.unauthorized' }, { status: 401 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(session) });
  
  if (!user?.mnemonicHashes?.length) {
    return json({ errorKey: 'auth.errors.userNotFound' }, { status: 404 });
  }

  const randomIndex = Math.floor(Math.random() * user.mnemonicHashes.length);
  
  return json({ index: randomIndex });
}