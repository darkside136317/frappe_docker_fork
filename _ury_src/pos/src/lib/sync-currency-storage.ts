import { storage } from './storage';
import { getCurrencyInfo } from './pos-profile-api';

/**
 * Keeps localStorage currency fields in sync with POS Profile so formatCurrency
 * never renders "undefined" / "null" (e.g. race before React POS store init).
 */
export async function syncCurrencyStorageFromProfile(profile: { currency?: string }): Promise<void> {
  const code = (profile.currency || 'INR').trim();
  storage.setItem('currency', code);

  const existing = storage.getItem('currencySymbol');
  if (existing === 'undefined' || existing === 'null' || existing === '') {
    storage.removeItem('currencySymbol');
  }
  if (storage.getItem('currencySymbol')) {
    return;
  }

  try {
    const doc = await getCurrencyInfo(code);
    const next = (doc.symbol || doc.name || code).trim();
    const safe =
      next && next !== 'undefined' && next !== 'null' ? next : code;
    storage.setItem('currencySymbol', safe);
  } catch {
    storage.setItem('currencySymbol', code);
  }
}
