import { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { t, setLanguage, isPosUiLanguage, useI18nLanguage } from '../i18n';
import { POS_UI_LANGUAGE_CODES, type PosUiLanguage } from '../i18n/config';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const active = useI18nLanguage();
  const current: PosUiLanguage = isPosUiLanguage(active) ? active : 'en';
  const [pending, setPending] = useState<PosUiLanguage | null>(null);

  const handleSelect = async (lang: PosUiLanguage) => {
    if (lang === current || pending) return;
    setPending(lang);
    try {
      await setLanguage(lang);
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="group"
      aria-label={t('language.label')}
    >
      {!compact && (
        <Globe className="w-4 h-4 text-gray-500 shrink-0" aria-hidden />
      )}
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {POS_UI_LANGUAGE_CODES.map((code) => {
          const isActive = code === current;
          const isLoading = pending === code;
          return (
            <button
              key={code}
              type="button"
              disabled={!!pending}
              onClick={() => handleSelect(code)}
              className={cn(
                'relative min-w-[2.75rem] px-2.5 py-1 text-xs font-semibold rounded-md transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                isActive
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
                pending && !isLoading && 'opacity-60'
              )}
              aria-pressed={isActive}
              aria-label={t(`language.${code}`)}
              title={t(`language.${code}`)}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 mx-auto animate-spin" />
              ) : (
                code.toUpperCase()
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
