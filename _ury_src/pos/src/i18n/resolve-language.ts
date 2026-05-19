import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './config';
/**
 * Resolves the active language using the following priority:
 * 1. localStorage (explicit POS language choice)
 * 2. frappe.boot.lang (Frappe user / site default)
 * 3. DEFAULT_LANGUAGE ('en')
 */
export function resolveLanguage(): string {
  const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLang && SUPPORTED_LANGUAGES[storedLang]) {
    return storedLang;
  }

  const frappeLang: string | undefined = (window as any)?.frappe?.boot?.lang;
  if (frappeLang && SUPPORTED_LANGUAGES[frappeLang]) {
    return frappeLang;
  }

  return DEFAULT_LANGUAGE;
}
