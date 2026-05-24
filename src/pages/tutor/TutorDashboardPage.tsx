import { HelpRequestList } from '@/components/tutor/HelpRequestList'
import { useTutorHelpRequestsQuery } from '@/hooks/tutor/useTutorHelpRequestsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function TutorDashboardPage() {
  const requestsQuery = useTutorHelpRequestsQuery()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tutor Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review and handle student teacher-help requests.
          </p>
        </div>
        {requestsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading requests...</p>}
        {requestsQuery.isError && <p className="text-sm text-destructive">Failed to load requests.</p>}
        {requestsQuery.data && <HelpRequestList requests={requestsQuery.data.items} />}
      </div>
    </DashboardLayout>
  )
}
