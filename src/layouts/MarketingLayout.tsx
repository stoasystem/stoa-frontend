import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '@/components/common/AppLogo'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/button'

export function MarketingHeader() {
  const { t } = useTranslation('common')

  return (
    <header className="sticky top-0 z-30 border-b bg-background/88 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <Link to="/" className="font-semibold tracking-tight">
          <AppLogo />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link className="transition-colors hover:text-foreground" to="/how-it-works">
            {t('navigation.howItWorks')}
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/for-parents">
            {t('navigation.parents')}
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/teacher-support">
            {t('navigation.tutors')}
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/pricing">
            {t('navigation.pricing')}
          </Link>
          <Link className="transition-colors hover:text-foreground" to="/login">
            {t('navigation.login')}
          </Link>
          <LanguageSwitcher compact />
          <Button asChild size="sm" className="premium-button-lift premium-primary-button h-9 rounded-full px-4">
            <Link to="/login?next=/chat">{t('navigation.startLearning')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  const { t } = useTranslation('common')

  return (
    <footer className="border-t bg-background/88">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7 text-sm text-muted-foreground">
        <span>{t('brand.platform')}</span>
        <div className="flex flex-wrap gap-4">
          <Link className="hover:text-foreground" to="/teacher-support">
            {t('navigation.forTutors')}
          </Link>
          <Link className="hover:text-foreground" to="/for-parents">
            {t('navigation.forParents')}
          </Link>
          <Link className="hover:text-foreground" to="/privacy">
            {t('navigation.privacy')}
          </Link>
          <Link className="hover:text-foreground" to="/terms">
            {t('navigation.terms')}
          </Link>
          <Link className="hover:text-foreground" to="/support">
            {t('navigation.support')}
          </Link>
          <LanguageSwitcher compact />
        </div>
      </div>
    </footer>
  )
}

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="premium-shell min-h-screen text-foreground">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  )
}
