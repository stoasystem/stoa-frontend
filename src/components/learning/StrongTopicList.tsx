import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LearningTopic } from '@/types/learningProfile'

export function StrongTopicList({ topics }: { topics: LearningTopic[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Strong topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-md border p-3">
            <p className="font-medium">{topic.topic}</p>
            <p className="text-sm text-muted-foreground">
              {topic.subject} · {topic.evidenceCount} signals
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
