import { Bell, CircleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminNotificationsQuery } from '@/hooks/notifications/useNotificationsQuery'

export function AdminOperationalNotificationsCard() {
  const query = useAdminNotificationsQuery()
  const items = query.data?.items ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Operational notifications
          </CardTitle>
          <Badge variant="secondary">{items.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading && <p className="text-sm text-muted-foreground">Loading operational events...</p>}
        {query.isError && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            Operational notifications are unavailable.
          </p>
        )}
        {!query.isLoading && !query.isError && items.length === 0 && (
          <p className="text-sm text-muted-foreground">No operational notification events yet.</p>
        )}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.slice(0, 5).map((event) => (
              <div key={event.eventId} className="rounded-md border border-border/70 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{event.summary}</p>
                  </div>
                  <Badge variant={event.status === 'created' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {event.eventType.replace(/_/g, ' ')} · {event.targetType}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
