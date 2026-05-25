import { useEffect } from 'react'
import { AdminAnalyticsCards } from '@/components/admin/AdminAnalyticsCards'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdminAnalyticsOverviewQuery } from '@/hooks/admin/useAdminAnalyticsOverviewQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function AdminAnalyticsPage() {
  const overviewQuery = useAdminAnalyticsOverviewQuery()

  useEffect(() => {
    trackEvent('admin_analytics_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin"
          title="Operational analytics"
          description="Demo launch dashboard for usage, conversion, support, tutor capacity, and retention signals."
        />
        {overviewQuery.data && <AdminAnalyticsCards overview={overviewQuery.data} />}
      </PageContainer>
    </DashboardLayout>
  )
}
