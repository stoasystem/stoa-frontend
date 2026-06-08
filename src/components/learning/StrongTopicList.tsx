import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LearningWeakTopic } from '@/types/learningProfile'

export function StrongTopicList({ topics }: { topics: LearningWeakTopic[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Strength topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length === 0 && (
          <p className="text-sm text-muted-foreground">No strength topics have enough evidence yet.</p>
        )}
        {topics.map((topic) => (
          <div key={`${topic.subject}-${topic.topicId}`} className="rounded-md border p-3">
            <p className="font-medium">{topic.label}</p>
            <p className="text-sm text-muted-foreground">
              {topic.subject} · {topic.count} signals
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
