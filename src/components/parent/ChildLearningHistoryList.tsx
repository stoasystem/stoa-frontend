import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import type { LearningHistoryItem } from '@/types/student'

export function ChildLearningHistoryList({
  items,
  emptyMessage = 'No learning history is available yet.',
}: {
  items: LearningHistoryItem[]
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className={item.href ? 'transition hover:border-primary/30' : undefined}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {item.href ? (
                  <Link className="font-medium transition-colors hover:text-primary" to={item.href}>
                    {item.title}
                  </Link>
                ) : (
                  <h2 className="font-medium">{item.title}</h2>
                )}
                {item.sourceLabel && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                    {item.sourceLabel}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.subject}</p>
            <p className="mt-3 text-sm leading-6">{item.summary}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
