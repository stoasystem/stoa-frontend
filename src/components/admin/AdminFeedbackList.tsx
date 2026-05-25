import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { AdminFeedbackItem } from '@/services/admin/adminApi'

type AdminFeedbackListProps = {
  items: AdminFeedbackItem[]
}

export function AdminFeedbackList({ items }: AdminFeedbackListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No feedback has been returned yet.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{item.type}</Badge>
              {item.status && <Badge variant="outline">{item.status}</Badge>}
              {item.userRole && <Badge variant="outline">{item.userRole}</Badge>}
            </div>
            <p className="text-sm leading-6 text-foreground">{item.message}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{item.page}</span>
              {item.userEmail && <span>{item.userEmail}</span>}
              <time>{new Date(item.createdAt).toLocaleString()}</time>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
