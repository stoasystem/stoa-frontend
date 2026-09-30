import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ICON, TOUCH_TARGET } from '@/components/base/sizes'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { languageNameKeys, useChangeLanguage } from '@/hooks/i18n/useChangeLanguage'
import { languageOptions, supportedLanguages, type SupportedLanguage } from '@/i18n/languages'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  compact?: boolean
  className?: string
  variant?: 'select' | 'footer' | 'sky'
}

export function LanguageSwitcher({ compact = false, className, variant = 'select' }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const { current, changeLanguage } = useChangeLanguage()
  const currentLanguage = languageOptions.find((language) => language.code === current) ?? languageOptions[0]

  if (variant === 'sky') {
    return <SkyLanguageMenu className={className} />
  }

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
                  'min-h-8 min-w-9 rounded px-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-[hsl(var(--stoa-brand-burgundy))] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-[hsl(var(--stoa-brand-burgundy-soft))] hover:text-foreground',
                )}
                aria-pressed={isActive}
                onClick={() => {
                  changeLanguage(language.code)
                }}
              >
                <span translate="no" className="notranslate">
                  {language.shortLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex h-8 w-14 items-center justify-between rounded-md border border-[hsl(var(--stoa-brand-border))] bg-[linear-gradient(180deg,hsl(var(--stoa-brand-card)/0.96),hsl(var(--stoa-brand-paper)/0.86))] px-2 text-xs font-semibold uppercase tracking-[0.02em] text-[hsl(var(--stoa-brand-ink))] shadow-[inset_0_1px_0_hsl(42_35%_98%/0.75),0_8px_18px_hsl(var(--stoa-brand-charcoal)/0.06)] transition-colors hover:border-[hsl(var(--stoa-brand-burgundy)/0.42)] hover:bg-[hsl(var(--stoa-brand-card))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--stoa-brand-burgundy)/0.2)]',
              className,
            )}
            aria-label={t('language.label')}
          >
            <span translate="no" className="notranslate">{currentLanguage.shortLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="min-w-20 rounded-lg border-[hsl(var(--stoa-brand-border))] bg-[hsl(var(--stoa-brand-card))] p-1.5 shadow-[0_18px_44px_hsl(var(--stoa-brand-charcoal)/0.16)]"
        >
          {languageOptions.map((language) => {
            const isActive = language.code === currentLanguage.code

            return (
              <DropdownMenuItem
                key={language.code}
                className={cn(
                  'flex h-8 cursor-pointer items-center justify-between rounded-md px-2.5 text-sm font-semibold uppercase tracking-[0.02em]',
                  isActive
                    ? 'bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-ink))]'
                    : 'text-muted-foreground hover:bg-[hsl(var(--stoa-brand-warm-grey)/0.65)] hover:text-foreground focus:bg-[hsl(var(--stoa-brand-warm-grey)/0.65)]',
                )}
                onSelect={() => {
                  changeLanguage(language.code)
                }}
              >
                <span translate="no" className="notranslate">{language.shortLabel}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1.5 text-sm text-muted-foreground transition-colors focus-within:border-primary/40 hover:text-foreground',
        className,
      )}
    >
      {!compact && <Languages className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{t('language.label')}</span>
      <select
        aria-label={t('language.label')}
        translate="no"
        className={cn(
          'notranslate bg-transparent text-inherit',
          'max-w-[8rem]',
        )}
        value={currentLanguage.code}
        onChange={(event) => {
          changeLanguage(event.target.value as SupportedLanguage)
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

/*
 * On a sky surface (the sign-in page, #53). The trigger is a plain button on
 * the sky -- white 85% (Placement: dark surface, secondary) -- with a 44 box
 * to tap. The list opens in a portal outside the sky, so it is the light
 * floating menu the account menu uses (#18: menus are always light).
 */
const SKY_MENU_PANEL =
  'z-50 flex min-w-[180px] flex-col rounded-[12px] border border-[color:var(--float-border)] bg-[rgba(255,255,255,0.96)] p-1.5 text-ink shadow-[var(--shadow-float)] backdrop-blur-[20px] outline-none'
const SKY_MENU_ITEM =
  'flex h-[34px] w-full cursor-pointer select-none items-center gap-2.5 rounded-[7px] border-0 bg-transparent px-2.5 text-left text-[14px] text-ink data-[highlighted]:bg-fill'

function SkyLanguageMenu({ className }: { className?: string }) {
  const { t } = useTranslation('common')
  const { current, changeLanguage } = useChangeLanguage()
  const currentLanguage = languageOptions.find((language) => language.code === current) ?? languageOptions[0]

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-1 border-0 bg-transparent px-2 text-[15px] font-semibold text-[color:var(--on-sky-plain)] transition-opacity duration-[var(--motion-press)] ease-out hover:opacity-70',
          className,
        )}
        style={{ minHeight: TOUCH_TARGET, minWidth: TOUCH_TARGET }}
        // The name carries what the button shows, "EN", so a voice command
        // naming it works (WCAG 2.5.3): "Language: English (EN)".
        aria-label={t('language.current', {
          language: t(languageNameKeys[currentLanguage.code]),
          code: currentLanguage.shortLabel,
        })}
      >
        <span translate="no" className="notranslate">{currentLanguage.shortLabel}</span>
        <ChevronDown aria-hidden="true" size={16} strokeWidth={ICON.stroke} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align="end" sideOffset={6} collisionPadding={8} className={SKY_MENU_PANEL}>
          <Menu.RadioGroup value={current}>
            {supportedLanguages.map((code) => (
              <Menu.RadioItem
                key={code}
                value={code}
                lang={code}
                onSelect={() => changeLanguage(code)}
                className={SKY_MENU_ITEM}
              >
                <span className="flex-1">{t(languageNameKeys[code])}</span>
                <Menu.ItemIndicator>
                  <Check aria-hidden="true" size={16} strokeWidth={ICON.stroke} className="text-accent" />
                </Menu.ItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  )
}
