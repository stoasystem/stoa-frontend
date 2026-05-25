import { useEffect } from 'react'
import { TutorAvailabilityEditor } from '@/components/tutor/TutorAvailabilityEditor'
import { TutorAvailabilitySummary } from '@/components/tutor/TutorAvailabilitySummary'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useTutorAvailabilityQuery } from '@/hooks/tutor/useTutorAvailabilityQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function TutorAvailabilityPage() {
  const availabilityQuery = useTutorAvailabilityQuery()

  useEffect(() => {
    trackEvent('tutor_availability_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Tutor operations"
          title="Availability"
          description="Set availability and subjects so support requests can be routed clearly."
        />
        {availabilityQuery.data && (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <TutorAvailabilityEditor availability={availabilityQuery.data} />
            <TutorAvailabilitySummary availability={availabilityQuery.data} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
