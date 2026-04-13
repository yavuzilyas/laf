export const languages = [
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'pt-PT', label: 'Português (Portugal)', flag: '🇵🇹' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { value: 'zh-HK', label: '繁體中文 (香港)', flag: '🇭🇰' },
  { value: 'zh-TW', label: '繁體中文 (台灣)', flag: '🇹🇼' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'he', label: 'עברית', flag: '🇮🇱' },
  { value: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { value: 'hy', label: 'Հայերեն', flag: '🇦🇲' },
  { value: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { value: 'krd', label: 'Kurdî', flag: '☀️' },
  { value: 'uk', label: 'Українська', flag: '🇺🇦' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { value: 'no', label: 'Norsk', flag: '🇳🇴' },
  { value: 'da', label: 'Dansk', flag: '🇩🇰' },
  { value: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { value: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { value: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { value: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { value: 'ro', label: 'Română', flag: '🇷🇴' },
  { value: 'hr', label: 'Hrvatski', flag: '🇭🇷' },
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'ms', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { value: 'th', label: 'ไทย', flag: '🇹🇭' },
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'ca', label: 'Català', flag: '🇪🇸' }
];

export const mainLanguageCodes = ['tr', 'en', 'es', 'fr', 'ar', 'hy', 'el'];

export const localeNames = languages.reduce((acc, lang) => {
  acc[lang.value] = lang.label;
  return acc;
}, {} as Record<string, string>);

export const localeFlags = languages.reduce((acc, lang) => {
  acc[lang.value] = lang.flag;
  return acc;
}, {} as Record<string, string>);

export const getLanguageDirection = (locale: string): 'rtl' | 'ltr' => {
  const rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];
  return rtlLocales.includes(locale) ? 'rtl' : 'ltr';
};
