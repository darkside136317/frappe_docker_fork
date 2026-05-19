import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { storage } from './storage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FrappeErrorLike = {
  message?: string;
  _server_messages?: string;
  exc_type?: string;
  exception?: string;
};

/** Extract a human-readable message from Frappe / frappe-js-sdk errors. */
export function parseFrappeError(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const e = error as FrappeErrorLike;

  if (e._server_messages) {
    try {
      const messages = JSON.parse(e._server_messages) as unknown[];
      for (const raw of messages) {
        const parsed =
          typeof raw === 'string' ? (JSON.parse(raw) as { message?: string }) : (raw as { message?: string });
        if (parsed?.message) {
          return String(parsed.message).replace(/<[^>]+>/g, '').trim();
        }
      }
    } catch {
      // fall through
    }
  }

  if (e.message && typeof e.message === 'string') {
    return e.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function formatCurrency(amount: number): string {
  let symbol =
    storage.getItem('currencySymbol') ||
    storage.getItem('currency') ||
    '';
  if (symbol === 'undefined' || symbol === 'null') {
    symbol = '';
  }
  const n = Number(amount);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(amount);
  return symbol ? `${symbol} ${formatted}` : formatted;
} 

export const formatInvoiceTime = (timestamp: string | null) => {
    if (!timestamp) return 'No bill activity yet';

    const parsedDate = new Date(timestamp);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' });
    }

    const timeOnlyMatch = timestamp.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (timeOnlyMatch) {
      const [, hours, minutes, seconds] = timeOnlyMatch;
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), Number(seconds), 0);
      const formatted = date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      if (/^\d{1,2}:\d{2}$/.test(formatted)) {
        return formatted;
      }
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }

    return timestamp;
  };