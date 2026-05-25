import { isSupportedLanguage, type SupportedLanguage } from '@/i18n/languages'

export type HeroTitleVariant = 'default' | 'stacked'
export type LocaleButtonSize = 'default' | 'wide'

export type LocaleLayout = {
  heroTitleVariant: HeroTitleVariant
  heroTitleMaxWidthClassName: string
  heroTitleClassName: string
  heroSubtitleMaxWidthClassName: string
  heroActionClassName: string
  buttonSize: LocaleButtonSize
}

export const localeLayout = {
  en: {
    heroTitleVariant: 'default',
    heroTitleMaxWidthClassName: 'max-w-[720px]',
    heroTitleClassName: 'text-5xl sm:text-6xl lg:text-7xl',
    heroSubtitleMaxWidthClassName: 'max-w-2xl',
    heroActionClassName: '',
    buttonSize: 'default',
  },
  de: {
    heroTitleVariant: 'stacked',
    heroTitleMaxWidthClassName: 'max-w-[680px]',
    heroTitleClassName: 'text-5xl sm:text-6xl lg:text-[4.35rem]',
    heroSubtitleMaxWidthClassName: 'max-w-3xl',
    heroActionClassName: 'sm:flex-wrap',
    buttonSize: 'wide',
  },
  fr: {
    heroTitleVariant: 'default',
    heroTitleMaxWidthClassName: 'max-w-[760px]',
    heroTitleClassName: 'text-5xl sm:text-6xl lg:text-7xl',
    heroSubtitleMaxWidthClassName: 'max-w-3xl',
    heroActionClassName: 'sm:flex-wrap',
    buttonSize: 'wide',
  },
  it: {
    heroTitleVariant: 'default',
    heroTitleMaxWidthClassName: 'max-w-[760px]',
    heroTitleClassName: 'text-5xl sm:text-6xl lg:text-7xl',
    heroSubtitleMaxWidthClassName: 'max-w-3xl',
    heroActionClassName: '',
    buttonSize: 'default',
  },
} satisfies Record<SupportedLanguage, LocaleLayout>

export function getLocaleLayout(language: string | null | undefined): LocaleLayout {
  const code = language?.slice(0, 2)

  if (isSupportedLanguage(code)) {
    return localeLayout[code]
  }

  return localeLayout.en
}
