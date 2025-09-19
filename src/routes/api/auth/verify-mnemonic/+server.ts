import { json } from '@sveltejs/kit';
import { getUsersCollection } from '$db/mongo';
import { ObjectId } from 'mongodb';

export async function POST({ request, cookies }) {
  const session = cookies.get('session');
  if (!session) {
    return json({ errorKey: 'auth.errors.unauthorized' }, { status: 401 });
  }

  const { index, word, attempts = 0 } = await request.json();

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new ObjectId(session) });
  
  if (!user?.mnemonicHashes?.length) {
    return json({ errorKey: 'auth.errors.userNotFound' }, { status: 404 });
  }

  if (index < 0 || index >= user.mnemonicHashes.length) {
    return json({ errorKey: 'auth.errors.invalidIndex' }, { status: 400 });
  }

  // Hash hesaplama
  const encoder = new TextEncoder();
  const inputHash = await crypto.subtle.digest('SHA-256', encoder.encode(word.toLowerCase()));
  const hashArray = Array.from(new Uint8Array(inputHash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (hashHex !== user.mnemonicHashes[index]) {
    if (attempts >= 2) {
      return json({ errorKey: 'auth.errors.maxAttemptsReached', reset: true }, { status: 400 });
    }
    return json({ errorKey: 'auth.errors.wrongMnemonic', attempts: attempts + 1 }, { status: 400 });
  }

  return json({ success: true, successKey: 'auth.success.mnemonicVerified' });
}