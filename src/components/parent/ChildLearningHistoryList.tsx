import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatDateTime'
import type { ParentChildActivity } from '@/types/parent'

type HistoryListItem = Omit<ParentChildActivity, 'type' | 'subject'> & {
  type?: ParentChildActivity['type']
  subject: string | null
  href?: string
  sourceLabel?: string
}

export function ChildLearningHistoryList({
  items,
  emptyMessage,
}: {
  items: HistoryListItem[]
  emptyMessage?: string
}) {
  const { t } = useTranslation('practice')
  const empty = emptyMessage ?? t('progress.history.empty')

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-medium">{item.title}</h2>
                {(item.sourceLabel || item.type) && (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                    {item.sourceLabel ?? formatActivityType(item.type ?? '')}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(item.createdAt)}
              </span>
            </div>
            {item.subject && <p className="mt-1 text-sm text-muted-foreground">{item.subject}</p>}
            <p className="mt-3 text-sm leading-6">{item.summary}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatActivityType(type: string) {
  return type.replace(/_/g, ' ')
}
