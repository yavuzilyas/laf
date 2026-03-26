// src/routes/api/message/+server.ts
import { json } from '@sveltejs/kit';
import { rpcCall } from '$lib/server/monero/rpc';

export async function POST() {
  const result = await rpcCall('get_balance');
  return json(result);
}
