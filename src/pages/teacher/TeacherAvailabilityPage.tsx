import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TeacherAvailabilityEditor } from '@/components/teacher/TeacherAvailabilityEditor'
import { TeacherAvailabilitySummary } from '@/components/teacher/TeacherAvailabilitySummary'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useTeacherWeeklyAvailabilityQuery } from '@/hooks/teacher/useTeacherWeeklyAvailabilityQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function TeacherAvailabilityPage() {
  const { t } = useTranslation('teacher')
  const availabilityQuery = useTeacherWeeklyAvailabilityQuery()

  useEffect(() => {
    trackEvent('teacher_availability_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow={t('availability.eyebrow')}
          title={t('availability.title')}
          description={t('availability.description')}
        />
        {availabilityQuery.data && (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <TeacherAvailabilityEditor availability={availabilityQuery.data} />
            <TeacherAvailabilitySummary availability={availabilityQuery.data} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
