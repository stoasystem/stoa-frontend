import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CurriculumTopicNode } from '@/types/curriculumGraph'

export function TopicDetailPanel({ topic }: { topic?: CurriculumTopicNode }) {
  if (!topic) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{topic.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="leading-6 text-muted-foreground">{topic.detail}</p>
        <div>
          <p className="font-medium">Recent questions</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            {topic.recentQuestions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </div>
        <div>
          <p className="font-medium">Recommendations</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            {topic.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
