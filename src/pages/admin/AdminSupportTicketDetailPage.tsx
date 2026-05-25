import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageActions } from '@/components/common/PageActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useSupportTicketQuery } from '@/hooks/support/useSupportTicketsQuery'
import { updateAdminSupportTicketStatus } from '@/services/support/supportTicketApi'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { SupportTicketStatus } from '@/types/supportTicket'

export function AdminSupportTicketDetailPage() {
  const { ticketId } = useParams()
  const queryClient = useQueryClient()
  const ticketQuery = useSupportTicketQuery(ticketId)
  const ticket = ticketQuery.data
  const [status, setStatus] = useState<SupportTicketStatus>('in_review')
  const updateMutation = useMutation({
    mutationFn: () => updateAdminSupportTicketStatus({ ticketId: ticketId ?? '', status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets', ticketId] })
    },
  })

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Admin support"
          title={ticket?.subject ?? 'Ticket detail'}
          description="Status changes are saved for the current demo session."
          actions={
            <PageActions
              primary={<Button asChild><Link to="/admin/help-requests">Help requests</Link></Button>}
              secondary={<BackButton label="Support inbox" to="/admin/support" />}
            />
          }
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Admin', to: '/admin' },
            { label: 'Support inbox', to: '/admin/support' },
            { label: ticket?.subject ?? 'Ticket detail' },
          ]}
        />
        {ticket && (
          <Card>
            <CardHeader><CardTitle className="text-base">{ticket.id}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>{ticket.message}</p>
              <div className="flex flex-wrap gap-3">
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SupportTicketStatus)}>
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="waiting_on_user">Waiting on user</option>
                  <option value="resolved">Resolved</option>
                </select>
                <Button type="button" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  Update status
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
