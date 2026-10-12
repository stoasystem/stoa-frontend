import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/layouts/AppLayout'

export function ForbiddenPage() {
  const { t } = useTranslation('common')
  return (
    <AppLayout>
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">{t('errorPages.forbidden.title')}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {t('errorPages.forbidden.body')}
        </p>
        <Button asChild>
          <Link to="/">{t('errorPages.forbidden.action')}</Link>
        </Button>
      </div>
    </AppLayout>
  )
}
