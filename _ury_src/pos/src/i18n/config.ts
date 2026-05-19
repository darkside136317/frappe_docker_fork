export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  vi: 'Tiếng Việt',
};

/** Languages exposed in the POS header switcher. */
export const POS_UI_LANGUAGES = {
  en: 'English',
  vi: 'Tiếng Việt',
} as const;

export type PosUiLanguage = keyof typeof POS_UI_LANGUAGES;

export const POS_UI_LANGUAGE_CODES = Object.keys(POS_UI_LANGUAGES) as PosUiLanguage[];

export const LANGUAGE_STORAGE_KEY = 'ury_language';
