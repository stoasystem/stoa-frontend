import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { RecentQuestion } from '@/types/dashboard'

const statusLabel: Record<RecentQuestion['status'], string> = {
  answered_by_ai: 'Explained',
  teacher_helped: 'Teacher helped',
  pending: 'Pending',
}

function formatQuestionDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function RecentQuestionsCard({ questions }: { questions: RecentQuestion[] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Recent Questions</CardTitle>
        <CardDescription>Questions and explanations from the latest study sessions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question) => (
          <div
            key={question.id}
            className="flex items-start justify-between gap-4 rounded-md border border-border/70 bg-[hsl(var(--platform-surface-app))] p-4"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium leading-5">{question.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {question.subject} · {formatQuestionDate(question.createdAt)}
              </div>
            </div>
            <Badge className="shrink-0" variant="secondary">
              {statusLabel[question.status]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
