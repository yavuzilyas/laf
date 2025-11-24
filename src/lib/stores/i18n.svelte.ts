// types/i18n.ts
export interface LocaleData {
  [key: string]: string | LocaleData;
}

export interface I18nConfig {
  defaultLocale: string;
  availableLocales: string[];
  fallbackLocale?: string;
}

export type TranslationKey = string;
export type InterpolationValues = Record<string, string | number>;

// stores/i18n.svelte.ts
import { browser } from '$app/environment';
import {
  dativeSuffix,
  locativeSuffix,
  ablativeSuffix,
  accusativeSuffix,
  possessiveSuffix,
  pluralSuffix,
  instrumentalSuffix,
  applySuffix,
  applySuffixTemplate
} from '$lib/utils/turkish-suffix';

// Toggle to silence missing translation warnings in terminal
const WARN_MISSING_TRANSLATIONS = false;

// Static import map - Vite uyumlu
const LOCALE_MODULES = {
  'en': () => import('$lib/locales/en.json'),
  'tr': () => import('$lib/locales/tr.json'),
  'de': () => import('$lib/locales/de.json'),
  'fr': () => import('$lib/locales/fr.json'),
  'es': () => import('$lib/locales/es.json'),
} as const;

class I18nStore {
  private _currentLocale = $state('tr');
  private _translations = $state<Record<string, LocaleData>>({});
  private _loading = $state(false);
  private _config: I18nConfig;
  private _loadedLocales = new Set<string>();

  constructor(config: I18nConfig) {
    this._config = config;
    this._currentLocale = config.defaultLocale;
    
    // Browser'da localStorage'dan dil tercihini yükle
    if (browser) {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale && config.availableLocales.includes(savedLocale)) {
        this._currentLocale = savedLocale;
      }
    }
  }

  get currentLocale() {
    return this._currentLocale;
  }

  get translations() {
    return this._translations;
  }

  get loading() {
    return this._loading;
  }

  get availableLocales() {
    return this._config.availableLocales;
  }

  async setLocale(locale: string) {
    if (!this._config.availableLocales.includes(locale)) {
      console.warn(`Locale '${locale}' is not available`);
      return;
    }

    this._currentLocale = locale;
    
    // Browser'da localStorage'a kaydet
    if (browser) {
      localStorage.setItem('locale', locale);
    }

    // Eğer bu dil daha önce yüklenmemişse, yükle
    if (!this._loadedLocales.has(locale)) {
      await this.loadLocale(locale);
    }
  }

  async loadLocale(locale: string) {
    if (this._loadedLocales.has(locale)) return;

    this._loading = true;
    try {
      // Static import map kullanarak yükle - Vite uyumlu
      const moduleLoader = LOCALE_MODULES[locale as keyof typeof LOCALE_MODULES];
      if (!moduleLoader) {
        throw new Error(`Locale '${locale}' not found in LOCALE_MODULES`);
      }
      
      const module = await moduleLoader();
      this._translations[locale] = module.default;
      this._loadedLocales.add(locale);
    } catch (error) {
      console.error(`Failed to load locale '${locale}':`, error);
      
      // Fallback locale'i dene
      if (this._config.fallbackLocale && locale !== this._config.fallbackLocale) {
        try {
          const fallbackLoader = LOCALE_MODULES[this._config.fallbackLocale as keyof typeof LOCALE_MODULES];
          if (fallbackLoader) {
            const fallbackModule = await fallbackLoader();
            this._translations[locale] = fallbackModule.default;
            this._loadedLocales.add(locale);
          }
        } catch (fallbackError) {
          console.error(`Failed to load fallback locale '${this._config.fallbackLocale}':`, fallbackError);
        }
      }
    } finally {
      this._loading = false;
    }
  }

  async loadAllLocales() {
    this._loading = true;
    try {
      const promises = this._config.availableLocales.map(locale => 
        this.loadLocale(locale)
      );
      await Promise.all(promises);
    } finally {
      this._loading = false;
    }
  }

  t(key: TranslationKey, values?: InterpolationValues): string {
    const translation = this.getNestedValue(
      this._translations[this._currentLocale] || {},
      key
    );

    if (translation === undefined) {
      // Fallback locale'i dene
      if (this._config.fallbackLocale && this._config.fallbackLocale !== this._currentLocale) {
        const fallbackTranslation = this.getNestedValue(
          this._translations[this._config.fallbackLocale] || {},
          key
        );
        if (fallbackTranslation !== undefined) {
          return this.interpolate(fallbackTranslation, values);
        }
      }
      
      if (WARN_MISSING_TRANSLATIONS) {
        console.warn(`Translation missing for key: ${key}`);
      }
      return key;
    }

    return this.interpolate(translation, values);
  }

  private getNestedValue(obj: LocaleData, path: string): string | undefined {
    const keys = path.split('.');
    let current: any = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  }

  private interpolate(template: string, values?: InterpolationValues): string {
    if (!values) return template;

    // Support both {key} and {{key}} formats
    return template.replace(/\{\{?(\w+)\}?\}/g, (match, key) => {
      return values[key]?.toString() ?? match;
    });
  }
}

// i18n konfigürasyonu
const i18nConfig: I18nConfig = {
  defaultLocale: 'en',
  availableLocales: ['en', 'tr'],
  fallbackLocale: 'tr'
};

// Global i18n instance
export const i18n = new I18nStore(i18nConfig);

// Utility fonksiyonlar
export const t = (key: TranslationKey, values?: InterpolationValues) => i18n.t(key, values);
export const setLocale = (locale: string) => i18n.setLocale(locale);
export const getCurrentLocale = () => i18n.currentLocale;
// Back-compat shim for older imports
export const getReactiveT = () => t;

// Convenience helpers for arrays of keys
export const tMany = (keys: TranslationKey[], values?: InterpolationValues) =>
  keys.map((k) => i18n.t(k, values));

export const tJoin = (keys: TranslationKey[], sep = ' ', values?: InterpolationValues) =>
  tMany(keys, values).join(sep);

// Attach helpers as methods for ergonomic usage: t.many([...]) and t.join([...], sep)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(t as any).many = tMany;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(t as any).join = tJoin;

// Locale-aware lower-first utility (handles Turkish dotted/dotless i)
function lowerFirstLocaleAware(input: string, locale: string): string {
  if (!input) return input;
  const first = input[0];
  const rest = input.slice(1);
  if (locale === 'tr') {
    // Turkish casing rules
    const map: Record<string, string> = { 'I': 'ı', 'İ': 'i' };
    const lowerFirst = map[first] ?? first.toLocaleLowerCase('tr');
    return lowerFirst + rest;
  }
  return first.toLocaleLowerCase(locale || undefined) + rest;
}

export const tLowerFirst = (key: TranslationKey, values?: InterpolationValues) =>
  lowerFirstLocaleAware(i18n.t(key, values), i18n.currentLocale);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(t as any).lowerFirst = tLowerFirst;

// Locale-aware Turkish suffix helpers
export const suffix = (word: string, suffixType: string, opts?: any) =>
  i18n.currentLocale === 'tr' ? applySuffix(word, suffixType, opts) : word;

export const tSuffix = (key: TranslationKey, suffixType: string, opts?: any, values?: InterpolationValues) =>
  suffix(i18n.t(key, values), suffixType, opts);

// Attach on t for ergonomic usage: t.suffix(word, 'dative'), t.sfx('Key','dative')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(t as any).suffix = suffix;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(t as any).sfx = tSuffix;

// Attach reactive-like getters and common methods so components can use t.currentLocale, t.setLocale, etc.
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tf = t as any;
  Object.defineProperties(tf, {
    currentLocale: { get: () => i18n.currentLocale },
    availableLocales: { get: () => i18n.availableLocales },
    loading: { get: () => i18n.loading }
  });
  tf.setLocale = (locale: string) => i18n.setLocale(locale);
  tf.loadLocale = (locale: string) => i18n.loadLocale(locale);
} catch (_) {
  // no-op if defineProperties fails
}

// Turkish suffix exports
export {
  dativeSuffix,
  locativeSuffix,
  ablativeSuffix,
  accusativeSuffix,
  possessiveSuffix,
  pluralSuffix,
  instrumentalSuffix,
  applySuffix,
  applySuffixTemplate
};
