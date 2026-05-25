import { useEffect } from 'react'
import { AdvancedAnalyticsContent } from '@/pages/admin/AdvancedAnalyticsPage'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function OrganizationAnalyticsPage() {
  useEffect(() => {
    trackEvent('advanced_analytics_viewed', { scope: 'organization' })
  }, [])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Organization"
          title="Organization analytics"
          description="Aggregated analytics for a selected school or tutoring workspace."
        />
        <AdvancedAnalyticsContent scope="organization" />
      </PageContainer>
    </DashboardLayout>
  )
}
