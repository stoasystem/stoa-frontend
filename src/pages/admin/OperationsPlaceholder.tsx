import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminOperationsPlaceholderPage({
  title,
}: {
  title: string
}) {
  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title={title}
          description="This operations area is being prepared for a later release."
        />
        <AdminUnavailableCard
          title={`${title} unavailable`}
          description="This page is not available yet. Use the active operations views for current pilot work."
        />
      </PageContainer>
    </DashboardLayout>
  )
}
