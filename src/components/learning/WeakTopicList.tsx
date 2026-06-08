import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LearningWeakTopic } from '@/types/learningProfile'

export function WeakTopicList({ topics }: { topics: LearningWeakTopic[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Weak topics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.length === 0 && (
          <p className="text-sm text-muted-foreground">No weak topics have enough evidence yet.</p>
        )}
        {topics.map((topic) => (
          <div key={`${topic.subject}-${topic.topicId}`} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{topic.label}</p>
                <p className="text-sm text-muted-foreground">{topic.subject}</p>
              </div>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                {topic.count} signals
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Evidence questions: {topic.evidenceQuestionIds.length}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
