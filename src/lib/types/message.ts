export interface MessageDoc {
  id?: string;

  message: string;

  xmrAddress: string;
  addressIndex: number;

  paid: boolean;
  txid?: string;
  amount?: number;

  createdAt: Date;
}
