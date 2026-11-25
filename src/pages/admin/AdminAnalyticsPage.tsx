import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ActiveTrendChart } from '@/components/admin/analytics/ActiveTrendChart'
import { AnalyticsKpis } from '@/components/admin/analytics/AnalyticsKpis'
import { FeatureRanking } from '@/components/admin/analytics/FeatureRanking'
import { RetentionHeatmap } from '@/components/admin/analytics/RetentionHeatmap'
import { SignupFunnel } from '@/components/admin/analytics/SignupFunnel'
import { SegmentedFilter } from '@/components/base'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Skeleton } from '@/components/common/Skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminAnalytics } from '@/hooks/admin/useAdminAnalytics'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { toUserFacingError } from '@/lib/userFacingText'
import {
  ANALYTICS_DAYS,
  ANALYTICS_ROLES,
  type AnalyticsDays,
  type AnalyticsOverview,
  type AnalyticsRole,
} from '@/services/admin/analyticsApi'

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function isEmpty(data: AnalyticsOverview) {
  return (
    data.activeSeries.every((point) => point.active === 0) &&
    data.featureRanking.length === 0 &&
    data.funnel.every((step) => step.count === 0) &&
    data.retention.length === 0
  )
}

/** Usage statistics (card 134): activity, feature use, onboarding and retention. */
export function AdminAnalyticsPage() {
  const { t } = useTranslation('admin')
  const [days, setDays] = useState<AnalyticsDays>(30)
  const [role, setRole] = useState<AnalyticsRole>('all')
  const query = useAdminAnalytics(days, role)
  const data = query.data

  const filters = (
    <div className="flex flex-wrap gap-2">
      <SegmentedFilter
        label={t('usageAnalytics.filters.role')}
        value={role}
        onChange={setRole}
        options={ANALYTICS_ROLES.map((value) => ({ value, label: t(`usageAnalytics.roles.${value}`) }))}
      />
      <SegmentedFilter
        label={t('usageAnalytics.filters.days')}
        value={String(days)}
        onChange={(value) => setDays(Number(value) as AnalyticsDays)}
        options={ANALYTICS_DAYS.map((value) => ({
          value: String(value),
          label: t('usageAnalytics.filters.daysOption', { count: value }),
        }))}
      />
    </div>
  )

  let body: ReactNode
  if (query.isPending) {
    body = (
      <div role="status" aria-label={t('usageAnalytics.loading')} className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  } else if (query.isError && !data) {
    body = <ErrorState message={toUserFacingError(query.error, t('usageAnalytics.loadFailed'))} />
  } else if (data) {
    body = (
      <div className="flex flex-col gap-4" aria-busy={query.isFetching}>
        {!data.complete ? (
          <p role="status" data-incomplete className="m-0 rounded-list bg-gold-tint px-4 py-3 text-sm text-gold">
            {t('usageAnalytics.incomplete')}
          </p>
        ) : null}
        {isEmpty(data) ? (
          <EmptyState
            title={t('usageAnalytics.empty.title')}
            description={t('usageAnalytics.empty.description')}
          />
        ) : (
          <>
            <AnalyticsKpis kpis={data.kpis} days={data.days} />
            <Section title={t('usageAnalytics.trend.title')}>
              <ActiveTrendChart series={data.activeSeries} />
            </Section>
            <div className="grid gap-4 lg:grid-cols-2">
              <Section title={t('usageAnalytics.ranking.title')}>
                <FeatureRanking rows={data.featureRanking} />
              </Section>
              <Section title={t('usageAnalytics.funnel.title')}>
                <SignupFunnel steps={data.funnel} />
              </Section>
            </div>
            <Section title={t('usageAnalytics.retention.title')}>
              <RetentionHeatmap rows={data.retention} />
            </Section>
          </>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader title={t('usageAnalytics.title')} description={t('usageAnalytics.description')} actions={filters} />
        {body}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminAnalyticsPage
