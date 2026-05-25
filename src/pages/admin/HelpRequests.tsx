import { AdminBackendPending } from '@/components/admin/AdminBackendPending'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminHelpRequestsQuery } from '@/hooks/admin/useAdminHelpRequestsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminHelpRequestsPage() {
  const query = useAdminHelpRequestsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin operations"
          title="Teacher help requests"
          description="Launch operations view for tutor-backed student requests."
        />
        {query.data?.items.map((request) => (
          <Card key={request.requestId}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{request.studentName}</p>
                <p className="text-muted-foreground">{request.subject} - {request.status}</p>
              </div>
              <p className="text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
        {query.isError && (
          <AdminBackendPending
            title="Help request backend pending"
            description="Expected endpoint: GET /admin/help-requests returning requestId, studentName, subject, status, priority, and createdAt."
          />
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
