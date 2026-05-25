import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { HelpRequestList } from '@/components/tutor/HelpRequestList'
import { TutorDashboardSkeleton } from '@/components/tutor/TutorDashboardSkeleton'
import { TutorStatsCards } from '@/components/tutor/TutorStatsCards'
import {
  TutorRequestFilters,
  type TutorRequestFilter,
} from '@/components/tutor/TutorRequestFilters'
import { useTutorHelpRequestsQuery } from '@/hooks/tutor/useTutorHelpRequestsQuery'
import { useTutorStatsQuery } from '@/hooks/tutor/useTutorStatsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function TutorDashboardPage() {
  const { t } = useTranslation('tutor')
  const requestsQuery = useTutorHelpRequestsQuery()
  const statsQuery = useTutorStatsQuery()
  const [filter, setFilter] = useState<TutorRequestFilter>('all')
  const requests = requestsQuery.data?.items ?? []
  const filteredRequests = useMemo(
    () => (filter === 'all' ? requests : requests.filter((request) => request.status === filter)),
    [filter, requests],
  )

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={t('dashboardTitle')}
          description={t('dashboardDescription')}
        />
        {requestsQuery.isLoading && <TutorDashboardSkeleton showHeader={false} />}
        {requestsQuery.isError && <p className="text-sm text-destructive">{t('loadRequestsFailed')}</p>}
        {requestsQuery.data && (
          <div className="space-y-4">
            <TutorStatsCards stats={statsQuery.data} />
            <TutorRequestFilters value={filter} onChange={setFilter} />
            <HelpRequestList requests={filteredRequests} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
