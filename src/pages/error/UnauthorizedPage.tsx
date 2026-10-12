import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/layouts/AuthLayout'

export function UnauthorizedPage() {
  const { t } = useTranslation('common')
  return (
    <AuthLayout>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{t('errorPages.unauthorized.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('errorPages.unauthorized.body')}</p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">{t('errorPages.unauthorized.action')}</Link>
        </Button>
      </section>
    </AuthLayout>
  )
}
