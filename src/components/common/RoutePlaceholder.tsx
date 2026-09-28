import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export type RoutePlaceholderProps = {
  /** The page's title key in `common`, supplied by its route manifest entry. */
  titleKey?: string
}

/**
 * Stands in for a student screen of the planet redesign (#13) until its slice
 * lands. It says what the screen will be and shows the address it was opened
 * at, so a deep link is visibly intact after a refresh.
 */
export function RoutePlaceholder({ titleKey }: RoutePlaceholderProps) {
  const { t } = useTranslation('common')
  const params = useParams()
  const entries = Object.entries(params).filter(([name]) => name !== '*')

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('studentRoutes.placeholder.eyebrow')}
          title={titleKey ? t(titleKey) : t('studentRoutes.placeholder.eyebrow')}
          description={t('studentRoutes.placeholder.body')}
        />
        {entries.length > 0 && (
          <dl className="mt-6 grid gap-1 text-sm text-muted-foreground" data-testid="route-params">
            {entries.map(([name, value]) => (
              <div className="flex gap-2" key={name}>
                <dt className="font-mono">{name}</dt>
                <dd className="font-mono text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
