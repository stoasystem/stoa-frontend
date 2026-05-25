import { Link } from 'react-router-dom'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { SupportTicket } from '@/types/supportTicket'

export function SupportTicketList({
  tickets,
  admin = false,
}: {
  tickets: SupportTicket[]
  admin?: boolean
}) {
  if (tickets.length === 0) {
    return <p className="text-sm text-muted-foreground">No support tickets yet. Create a request when you need help.</p>
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card key={ticket.id}>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Link
                className="font-medium hover:underline"
                to={admin ? `/admin/support/${ticket.id}` : `/support/tickets/${ticket.id}`}
              >
                {ticket.subject}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.category} · {new Date(ticket.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary"><SafeStatusLabel kind="supportPriority" value={ticket.priority} /></Badge>
              <Badge><SafeStatusLabel kind="supportTicket" value={ticket.status} /></Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
