// utils/suffix.ts
const VOWELS_BACK = ['a','ı','o','u'];
const VOWELS_FRONT = ['e','i','ö','ü'];
const VOWELS = [...VOWELS_BACK, ...VOWELS_FRONT];

export function dativeSuffix(word: string, opts?: { apostrophe?: boolean }) {
  if (!word) return word;

  const apostrophe = !!opts?.apostrophe;

  // locale-aware lowercase for Turkish (İ -> i sorununu önler)
  const lower = word.toLocaleLowerCase('tr-TR');

  // son harfi ve son ünlüyü bul
  const lastChar = lower.charAt(lower.length - 1);
  let lastVowel = '';
  for (let i = lower.length - 1; i >= 0; i--) {
    if (VOWELS.includes(lower[i])) { lastVowel = lower[i]; break; }
  }

  // fallback: e seç (nadiren olur)
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'a' : 'e';

  // buffer (y) sadece kelime ünlü ile bitiyorsa
  const needsBuffer = VOWELS.includes(lastChar);
  const buffer = needsBuffer ? 'y' : '';

  const sep = apostrophe ? "'" : '';

  return `${word}${sep}${buffer}${harmony}`;
}
