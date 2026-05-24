import { useMemo, useState } from 'react'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { HelpRequestList } from '@/components/tutor/HelpRequestList'
import { TutorDashboardSkeleton } from '@/components/tutor/TutorDashboardSkeleton'
import {
  TutorRequestFilters,
  type TutorRequestFilter,
} from '@/components/tutor/TutorRequestFilters'
import { useTutorHelpRequestsQuery } from '@/hooks/tutor/useTutorHelpRequestsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function TutorDashboardPage() {
  const requestsQuery = useTutorHelpRequestsQuery()
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
          title="Tutor Dashboard"
          description="Review and handle student teacher-help requests."
        />
        {requestsQuery.isLoading && <TutorDashboardSkeleton showHeader={false} />}
        {requestsQuery.isError && <p className="text-sm text-destructive">Failed to load requests.</p>}
        {requestsQuery.data && (
          <div className="space-y-4">
            <TutorRequestFilters value={filter} onChange={setFilter} />
            <HelpRequestList requests={filteredRequests} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
