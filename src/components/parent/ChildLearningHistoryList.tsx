import { Card, CardContent } from '@/components/ui/card'
import type { LearningHistoryItem } from '@/types/student'

export function ChildLearningHistoryList({ items }: { items: LearningHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No learning history is available yet.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-medium">{item.title}</h2>
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
