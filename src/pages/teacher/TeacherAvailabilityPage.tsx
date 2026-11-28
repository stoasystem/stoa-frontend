import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TeacherAvailabilityEditor } from '@/components/teacher/TeacherAvailabilityEditor'
import { TeacherAvailabilitySummary } from '@/components/teacher/TeacherAvailabilitySummary'
import { TeacherDispatchStatusCard } from '@/components/teacher/TeacherDispatchStatusCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
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
        {availabilityQuery.isLoading && <PageSkeleton rows={4} />}
        {availabilityQuery.isError && (
          <p role="alert" className="text-sm text-destructive">{t('availability.loadFailed')}</p>
        )}
        {availabilityQuery.data && (
          <div className="space-y-6">
            {/* First on the page: a teacher sent here by the bell sees at once whether they take requests (#768). */}
            <TeacherDispatchStatusCard status={availabilityQuery.data.status} />
            <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
              <TeacherAvailabilityEditor availability={availabilityQuery.data} />
              <TeacherAvailabilitySummary availability={availabilityQuery.data} />
            </div>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
