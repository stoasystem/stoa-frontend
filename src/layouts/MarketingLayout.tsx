import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '@/components/common/AppLogo'
import { AppFooter } from '@/components/common/AppFooter'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/button'

export function MarketingHeader() {
  const { t } = useTranslation('common')

  return (
    <header className="sticky top-0 z-30 border-b bg-card/88 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
        <Link to="/" className="min-w-0 font-semibold">
          <AppLogo />
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/how-it-works">
            {t('navigation.howItWorks')}
          </Link>
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/for-parents">
            {t('navigation.parents')}
          </Link>
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/teacher-support">
            {t('navigation.tutors')}
          </Link>
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/pricing">
            {t('navigation.pricing')}
          </Link>
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/contact">
            {t('navigation.contact')}
          </Link>
          <Link className="whitespace-nowrap transition-colors hover:text-[hsl(var(--stoa-brand-burgundy))]" to="/login">
            {t('navigation.login')}
          </Link>
          <LanguageSwitcher compact />
          <Button asChild size="sm" className="premium-button-lift premium-primary-button h-auto min-h-9 rounded-md px-4 py-2 whitespace-normal text-center">
            <Link to="/login?next=/chat">{t('navigation.startLearning')}</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return <AppFooter />
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
