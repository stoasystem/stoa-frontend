import { AdminBackendPending } from '@/components/admin/AdminBackendPending'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminOperationsPlaceholderPage({
  title,
  endpoint,
}: {
  title: string
  endpoint: string
}) {
  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title={title}
          description="Launch operations contract shell. Full workflow management remains deferred."
        />
        <AdminBackendPending
          title={`${title} backend pending`}
          description={`Expected endpoint: ${endpoint}. This route exists so early operations and backend contracts can be tested without building a full CRM or BI system.`}
        />
      </PageContainer>
    </DashboardLayout>
  )
}
