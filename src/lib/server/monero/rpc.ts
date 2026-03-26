// src/lib/server/monero/rpc.ts
const RPC_URL = 'http://127.0.0.1:28082/json_rpc';
const RPC_USER = 'rpcuser';
const RPC_PASS = 'rpcpass';

const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');

export async function rpcCall(method: string, params: any = {}) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '0',
      method,
      params
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RPC HTTP ${res.status}: ${text}`);
  }

  return res.json();
}
