import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
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
          <AdminUnavailableCard
            title="Usage summary unavailable"
            description="We could not load the usage summary right now. Please try again in a moment."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminUsagePage
