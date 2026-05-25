import { AdminUnavailableCard } from '@/components/admin/AdminUnavailableCard'
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
          description="Feedback list for pilot triage. Full support workflow management remains deferred."
        />
        {feedbackQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading feedback.</p>
        )}
        {feedbackQuery.data && <AdminFeedbackList items={feedbackQuery.data.items} />}
        {feedbackQuery.isError && (
          <AdminUnavailableCard
            title="Feedback unavailable"
            description="We could not load feedback right now. Please try again in a moment."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

export default AdminFeedbackPage
