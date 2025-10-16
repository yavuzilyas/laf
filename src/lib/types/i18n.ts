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
