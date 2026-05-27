import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeakTopic } from '@/types/dashboard'

const levelVariant: Record<WeakTopic['level'], 'default' | 'secondary' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
}

export function WeakTopicsCard({ topics }: { topics: WeakTopic[] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Weak Topics</CardTitle>
        <CardDescription>Topics that need attention in the next study cycle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">{topic.topic}</div>
              <div className="mt-1 text-xs text-muted-foreground">{topic.subject}</div>
            </div>
            <Badge className="shrink-0 capitalize" variant={levelVariant[topic.level]}>
              {topic.level}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
