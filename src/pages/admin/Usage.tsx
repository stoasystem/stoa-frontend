import { AdminBackendPending } from '@/components/admin/AdminBackendPending'
import { AdminUsageSummaryCards } from '@/components/admin/AdminUsageSummaryCards'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdminUsageSummaryQuery } from '@/hooks/admin/useAdminUsageSummaryQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminUsagePage() {
  const usageQuery = useAdminUsageSummaryQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title="Usage summary"
          description="Pilot usage boundary for active users, role counts, messages, help requests, uploads, and feedback."
        />
        {usageQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading usage summary.</p>
        )}
        {usageQuery.data && <AdminUsageSummaryCards summary={usageQuery.data} />}
        {usageQuery.isError && (
          <AdminBackendPending
            title="Usage backend pending"
            description="The frontend contract expects GET /admin/usage-summary to return activeUsers, roleCounts, messages, helpRequests, uploads, feedback, and optional generatedAt fields."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminUsagePage
