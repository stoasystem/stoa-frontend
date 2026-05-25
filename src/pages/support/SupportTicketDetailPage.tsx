import { Link, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
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
          actions={
            <PageActions
              primary={<Button asChild><Link to="/support">Contact support</Link></Button>}
              secondary={<BackButton label="All tickets" to="/support/tickets" />}
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Support', to: '/support' },
            { label: 'Tickets', to: '/support/tickets' },
            { label: ticket?.subject ?? 'Ticket' },
          ]}
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
