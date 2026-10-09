import { BookOpenCheck, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeTeacherRequestContext } from '@/types/practice'

export function PracticeRequestContextCard({
  context,
}: {
  context: PracticeTeacherRequestContext
}) {
  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">
              Source: {context.source === 'question-bank' ? 'Practice Library' : 'Practice Path'}
            </p>
            <CardTitle className="text-xl">The student requested support after practising this step.</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <ContextItem label="Topic" value={context.topic} />
          <ContextItem label="Attempts" value={`${context.attempts}`} />
          <ContextItem label="Student answer" value={context.studentAnswer || 'Not recorded'} />
          <ContextItem label="Hint viewed" value={context.hintViewed ? 'Yes' : 'No'} />
        </div>
        {context.challengePrompt && (
          <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Question</p>
            <p className="mt-2 text-sm leading-6">{context.challengePrompt}</p>
          </div>
        )}
        <div className="flex gap-2 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3 text-sm leading-6 text-muted-foreground">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            Learning context helps you see where the student got stuck before joining the request.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
