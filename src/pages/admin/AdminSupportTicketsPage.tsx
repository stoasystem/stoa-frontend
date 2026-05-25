import { SupportTicketList } from '@/components/support/SupportTicketList'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useAdminSupportTicketsQuery } from '@/hooks/support/useSupportTicketsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function AdminSupportTicketsPage() {
  const ticketsQuery = useAdminSupportTicketsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin"
          title="Support triage"
          description="Review support requests and coordinate the next operational step."
        />
        {ticketsQuery.data && <SupportTicketList tickets={ticketsQuery.data.items} admin />}
      </PageContainer>
    </DashboardLayout>
  )
}
