import type { ObjectId } from 'mongodb';

export interface MessageDoc {
  _id?: ObjectId;

  message: string;

  xmrAddress: string;
  addressIndex: number;

  paid: boolean;
  txid?: string;
  amount?: number;

  createdAt: Date;
}
