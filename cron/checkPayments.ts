import { getMessagesCollection } from '../src/lib/server/db/mongo';
import { getTransfers } from '../src/lib/server/monero/rpc';

async function run() {
  const messages = await getMessagesCollection();

  setInterval(async () => {
    const data = await getTransfers();
    if (!data.in) return;

    for (const tx of data.in) {
      if (tx.confirmations < 10) continue;

      const msg = await messages.findOne({
        addressIndex: tx.subaddr_index.minor,
        paid: false
      });

      if (!msg) continue;

      await messages.updateOne(
        { _id: msg._id },
        {
          $set: {
            paid: true,
            txid: tx.txid,
            amount: tx.amount / 1e12
          }
        }
      );
    }
  }, 30000);
}
if (process.env.MOCK_PAYMENTS === 'true') {
  await messages.updateOne(
    { paid: false },
    {
      $set: {
        paid: true,
        txid: 'mock_txid',
        amount: 0.123
      }
    }
  );
  return;
}

run();
