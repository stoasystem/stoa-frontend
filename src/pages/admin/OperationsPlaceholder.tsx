import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'

/*
 * The route manifest passes an English title (the route fixtures pin it). The
 * two routes that use this page have a phrase in `admin`, looked up by path;
 * any other route shows the title as given.
 */
const titleKeys: Record<string, string> = {
  '/admin/system': 'system.status',
  '/admin/billing-interest': 'placeholder.billingInterest',
}

export function AdminOperationsPlaceholderPage({
  title,
}: {
  title: string
}) {
  const { t } = useTranslation('admin')
  const { pathname } = useLocation()
  const titleKey = titleKeys[pathname]
  const name = titleKey ? t(titleKey, { defaultValue: title }) : title
  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('placeholder.eyebrow')}
          title={name}
          description={t('placeholder.description')}
        />
        <AdminUnavailableCard
          title={t('placeholder.unavailableTitle', { title: name })}
          description={t('placeholder.unavailableDescription')}
        />
      </PageContainer>
    </DashboardLayout>
  )
}
