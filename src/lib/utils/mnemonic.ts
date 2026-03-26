import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Generates a new 12-word BIP39 mnemonic phrase
 * @returns A 12-word mnemonic phrase
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(wordlist, 128); // 128 bits = 12 words
}

/**
 * Validates a mnemonic phrase
 * @param mnemonic The mnemonic phrase to validate
 * @returns True if valid, false otherwise
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Normalizes a mnemonic phrase (trims, lowercase, removes extra spaces)
 * @param phrase The mnemonic phrase to normalize
 * @returns Normalized mnemonic phrase
 */
export function normalizeMnemonic(phrase: string): string {
  return (phrase || '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}
