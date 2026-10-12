import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function NotFoundPage() {
  const { t } = useTranslation('common')
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-3xl font-semibold">{t('errorPages.notFound.title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('errorPages.notFound.body')}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t('errorPages.notFound.action')}</Link>
        </Button>
      </section>
    </MarketingLayout>
  )
}
