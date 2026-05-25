import { SupportTicketForm } from '@/components/support/SupportTicketForm'
import { SupportTicketList } from '@/components/support/SupportTicketList'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useSupportTicketsQuery } from '@/hooks/support/useSupportTicketsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function SupportTicketsPage() {
  const ticketsQuery = useSupportTicketsQuery()

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Support"
          title="Support tickets"
          description="Create and review support requests in the frontend demo ticket flow."
        />
        <SupportTicketForm />
        {ticketsQuery.data && <SupportTicketList tickets={ticketsQuery.data.items} />}
      </PageContainer>
    </DashboardLayout>
  )
}
