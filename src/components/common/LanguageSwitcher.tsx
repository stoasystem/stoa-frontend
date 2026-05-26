import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languageOptions, type SupportedLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  compact?: boolean
  className?: string
  variant?: 'select' | 'footer'
}

export function LanguageSwitcher({ compact = false, className, variant = 'select' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common')
  const currentLanguage = languageOptions.find((language) => language.code === i18n.language) ?? languageOptions[0]

  if (variant === 'footer') {
    return (
      <div
        className={cn(
          'inline-flex max-w-full flex-wrap items-center gap-2 rounded-md border border-border/80 bg-[hsl(var(--stoa-brand-paper)_/_0.75)] p-1.5 text-sm shadow-[inset_0_1px_0_hsl(42_35%_98%/0.65)]',
          className,
        )}
        role="group"
        aria-label={t('language.label')}
      >
        <span className="inline-flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Languages className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
          {t('language.label')}
        </span>
        <div className="flex rounded-md border border-border/70 bg-card/70 p-0.5">
          {languageOptions.map((language) => {
            const isActive = language.code === currentLanguage.code

            return (
              <button
                key={language.code}
                type="button"
                className={cn(
                  'min-h-8 min-w-9 rounded px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-[hsl(var(--stoa-brand-burgundy))] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-[hsl(var(--stoa-brand-burgundy-soft))] hover:text-foreground',
                )}
                aria-pressed={isActive}
                onClick={() => {
                  void i18n.changeLanguage(language.code)
                }}
              >
                {language.shortLabel}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors focus-within:border-primary/40 hover:text-foreground',
        compact && 'gap-1 px-2 py-1 text-xs',
        className,
      )}
    >
      {!compact && <Languages className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        className={cn(
          'bg-transparent text-inherit outline-none',
          compact ? 'max-w-11 font-semibold' : 'max-w-[8rem]',
        )}
        value={currentLanguage.code}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value as SupportedLanguage)
        }}
      >
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code}>
            {compact ? language.shortLabel : language.label}
          </option>
        ))}
      </select>
    </label>
  )
}
