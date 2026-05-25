import { AdminBackendPending } from '@/components/admin/AdminBackendPending'
import { AdminFeedbackList } from '@/components/admin/AdminFeedbackList'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdminFeedbackListQuery } from '@/hooks/admin/useAdminFeedbackListQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminFeedbackPage() {
  const feedbackQuery = useAdminFeedbackListQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title="Feedback"
          description="Feedback list contract for pilot triage. Full support workflow management remains deferred."
        />
        {feedbackQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading feedback.</p>
        )}
        {feedbackQuery.data && <AdminFeedbackList items={feedbackQuery.data.items} />}
        {feedbackQuery.isError && (
          <AdminBackendPending
            title="Feedback backend pending"
            description="The frontend contract expects GET /admin/feedback to return items with id, type, message, page, createdAt, and optional userRole, userEmail, and status fields."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminFeedbackPage
