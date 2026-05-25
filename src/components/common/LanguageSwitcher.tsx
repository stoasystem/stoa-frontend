import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languageOptions, type SupportedLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({ compact = false, className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('common')
  const currentLanguage = languageOptions.find((language) => language.code === i18n.language) ?? languageOptions[0]

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors focus-within:border-primary/40 hover:text-foreground',
        compact && 'px-2 py-1 text-xs',
        className,
      )}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{t('language.label')}</span>
      {!compact && <span className="hidden sm:inline">{currentLanguage.label}</span>}
      {compact && <span aria-hidden="true">{currentLanguage.shortLabel}</span>}
      <select
        aria-label={t('language.label')}
        className="max-w-[8rem] bg-transparent text-inherit outline-none"
        value={currentLanguage.code}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value as SupportedLanguage)
        }}
      >
        {languageOptions.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  )
}
