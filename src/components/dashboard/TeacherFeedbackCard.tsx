import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherFeedback } from '@/types/dashboard'

function formatFeedbackDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function TeacherFeedbackCard({ feedback }: { feedback: TeacherFeedback[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Teacher Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedback.map((item) => (
          <div key={item.id} className="rounded-lg border bg-background p-4">
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
