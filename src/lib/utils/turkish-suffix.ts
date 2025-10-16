// utils/turkish-suffix.ts - Türkçe dil bilgisi kuralları
const VOWELS_BACK = ['a', 'ı', 'o', 'u'];
const VOWELS_FRONT = ['e', 'i', 'ö', 'ü'];
const VOWELS = [...VOWELS_BACK, ...VOWELS_FRONT];

const CONSONANTS_HARD = ['ç', 'f', 'h', 'k', 'p', 's', 'ş', 't'];
const CONSONANTS_SOFT = ['b', 'c', 'd', 'g', 'ğ', 'j', 'l', 'm', 'n', 'r', 'v', 'y', 'z'];

interface SuffixOptions {
  apostrophe?: boolean;
  properNoun?: boolean;
}

/**
 * Türkçe ünlü uyumuna göre son ünlüyü bulur
 */
function getLastVowel(word: string): string {
  const lower = word.toLocaleLowerCase('tr-TR');
  for (let i = lower.length - 1; i >= 0; i--) {
    if (VOWELS.includes(lower[i])) {
      return lower[i];
    }
  }
  return 'e'; // fallback
}

/**
 * Ünsüz yumuşaması kontrolü
 */
function needsConsonantSoftening(word: string): boolean {
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  return ['p', 't', 'k', 'ç'].includes(lastChar);
}

/**
 * Yönelme hali (dative case) -e/-a
 */
export function dativeSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'a' : 'e';
  
  // Buffer (y) ünlü ile bitiyorsa
  const needsBuffer = VOWELS.includes(lastChar);
  const buffer = needsBuffer ? 'y' : '';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${buffer}${harmony}`;
}

/**
 * Bulunma hali (locative case) -de/-da/-te/-ta
 */
export function locativeSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'a' : 'e';
  
  // Ünsüz sertliği/yumuşaklığı
  const consonant = CONSONANTS_HARD.includes(lastChar) ? 't' : 'd';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${consonant}${harmony}`;
}

/**
 * Çıkma hali (ablative case) -den/-dan/-ten/-tan
 */
export function ablativeSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'a' : 'e';
  
  // Ünsüz sertliği/yumuşaklığı
  const consonant = CONSONANTS_HARD.includes(lastChar) ? 't' : 'd';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${consonant}${harmony}n`;
}

/**
 * Belirtme hali (accusative case) -i/-ı/-u/-ü/-yi/-yı/-yu/-yü
 */
export function accusativeSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  let harmony: string;
  if (VOWELS_BACK.includes(lastVowel)) {
    harmony = ['a', 'o'].includes(lastVowel) ? 'ı' : 'u';
  } else {
    harmony = ['e', 'ö'].includes(lastVowel) ? 'i' : 'ü';
  }
  
  // Buffer (y) ünlü ile bitiyorsa
  const needsBuffer = VOWELS.includes(lastChar);
  const buffer = needsBuffer ? 'y' : '';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${buffer}${harmony}`;
}

/**
 * İyelik eki (possessive) -in/-ın/-un/-ün
 */
export function possessiveSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  let harmony: string;
  if (VOWELS_BACK.includes(lastVowel)) {
    harmony = ['a', 'o'].includes(lastVowel) ? 'ın' : 'un';
  } else {
    harmony = ['e', 'ö'].includes(lastVowel) ? 'in' : 'ün';
  }
  
  // Buffer (n) ünlü ile bitiyorsa
  const needsBuffer = VOWELS.includes(lastChar);
  const buffer = needsBuffer ? 'n' : '';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${buffer}${harmony}`;
}

/**
 * Çoğul eki (plural) -ler/-lar
 */
export function pluralSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'lar' : 'ler';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${harmony}`;
}

/**
 * Araç hali (instrumental case) -le/-la/-yle/-yla
 */
export function instrumentalSuffix(word: string, opts?: SuffixOptions): string {
  if (!word) return word;

  const { apostrophe = false, properNoun = false } = opts || {};
  const lower = word.toLocaleLowerCase('tr-TR');
  const lastChar = lower.charAt(lower.length - 1);
  const lastVowel = getLastVowel(word);

  // Ünlü uyumu
  const harmony = VOWELS_BACK.includes(lastVowel) ? 'la' : 'le';
  
  // Buffer (y) ünlü ile bitiyorsa
  const needsBuffer = VOWELS.includes(lastChar);
  const buffer = needsBuffer ? 'y' : '';
  
  const sep = (apostrophe || properNoun) ? "'" : '';
  
  return `${word}${sep}${buffer}${harmony}`;
}

/**
 * Kelimeye uygun suffix uygula
 */
export function applySuffix(word: string, suffixType: string, opts?: SuffixOptions): string {
  switch (suffixType) {
    case 'dative':
    case 'e':
      return dativeSuffix(word, opts);
    case 'locative':
    case 'de':
      return locativeSuffix(word, opts);
    case 'ablative':
    case 'den':
      return ablativeSuffix(word, opts);
    case 'accusative':
    case 'i':
      return accusativeSuffix(word, opts);
    case 'possessive':
    case 'in':
      return possessiveSuffix(word, opts);
    case 'plural':
    case 'ler':
      return pluralSuffix(word, opts);
    case 'instrumental':
    case 'le':
      return instrumentalSuffix(word, opts);
    default:
      return word;
  }
}

/**
 * Template string'de suffix'leri uygular
 * Örnek: applySuffixTemplate("{{name|dative}} git", { name: "Ali" })
 * Sonuç: "Ali'ye git"
 */
export function applySuffixTemplate(template: string, values: Record<string, any>): string {
  return template.replace(/\{\{(\w+)(?:\|(\w+))?(?:\|(apostrophe|proper))?\}\}/g, (match, key, suffix, option) => {
    const value = values[key]?.toString() || match;
    if (!suffix) return value;
    
    const opts: SuffixOptions = {};
    if (option === 'apostrophe') opts.apostrophe = true;
    if (option === 'proper') opts.properNoun = true;
    
    return applySuffix(value, suffix, opts);
  });
}