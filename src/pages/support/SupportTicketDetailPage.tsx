import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useSupportTicketQuery } from '@/hooks/support/useSupportTicketsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { useEffect } from 'react'

export function SupportTicketDetailPage() {
  const { ticketId } = useParams()
  const ticketQuery = useSupportTicketQuery(ticketId)
  const ticket = ticketQuery.data

  useEffect(() => {
    if (ticketId) trackEvent('support_ticket_viewed', { ticketId })
  }, [ticketId])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Support ticket"
          title={ticket?.subject ?? 'Ticket'}
          description="Ticket detail is backed by demo API data until a production support backend exists."
          actions={<Button asChild variant="outline"><Link to="/support/tickets">All tickets</Link></Button>}
        />
        {ticket && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {ticket.status} · {ticket.priority}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>{ticket.message}</p>
              <p>Requester: {ticket.requesterEmail ?? 'Current user'}</p>
              <p>Updated: {new Date(ticket.updatedAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
