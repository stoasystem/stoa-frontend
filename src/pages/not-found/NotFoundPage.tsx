import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

/*
 * An address that leads nowhere. Signed in, the reader stays inside the app
 * shell (the bar, the bell, the avatar menu), as on /support (#46, #411);
 * signed out, it is the public page.
 */
export function NotFoundPage() {
  const { t } = useTranslation('common')
  const signedIn = useAuthStore((state) => state.isAuthenticated && state.user !== null)
  const Layout = signedIn ? DashboardLayout : MarketingLayout
  return (
    <Layout>
      {/* The shell pads its page area already. */}
      <section className={cn(!signedIn && 'mx-auto max-w-6xl px-6 py-20')}>
        <h1 className="text-3xl font-semibold">{t('errorPages.notFound.title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('errorPages.notFound.body')}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t('errorPages.notFound.action')}</Link>
        </Button>
      </section>
    </Layout>
  )
}
