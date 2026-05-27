import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherFeedback } from '@/types/dashboard'

function formatFeedbackDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function TeacherFeedbackCard({ feedback }: { feedback: TeacherFeedback[] }) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-[var(--platform-shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">Teacher Feedback</CardTitle>
        <CardDescription>Human guidance after a student needs more support.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-primary/10 bg-[hsl(var(--stoa-brand-burgundy-soft)_/_0.42)] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium">{item.teacherName}</div>
              <div className="text-xs text-muted-foreground">{formatFeedbackDate(item.createdAt)}</div>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
