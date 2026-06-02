import { Activity, BookOpenCheck, GraduationCap, MessageCircle, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeParentSummary } from '@/types/practice'

export function LearningActivitySummary({
  summary,
}: {
  summary?: PracticeParentSummary
}) {
  const metrics = [
    {
      label: 'Practice lessons',
      value: `${summary?.lessonsCompletedThisWeek ?? 3}`,
      icon: BookOpenCheck,
    },
    {
      label: 'Questions asked',
      value: `${summary?.questionsAsked ?? 2}`,
      icon: MessageCircle,
    },
    {
      label: 'Tutor support',
      value: `${summary?.teacherSupportRequested ?? 1}`,
      icon: GraduationCap,
    },
    {
      label: 'Practice Library',
      value: `${summary?.questionBankSetsAttempted ?? 4} sets`,
      icon: Activity,
    },
    {
      label: 'Next focus',
      value: summary?.questionBankNextFocus ?? summary?.recommendedNextTopic ?? 'Next practice topic',
      icon: Target,
    },
  ]

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Learning activity</p>
            <CardTitle className="text-xl">Learning support in one view</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Practice Path shows guided progress. Practice Library shows targeted independent practice.
          Learning Assistant questions, tutor support, and Online Classroom sessions show where explanation is needed.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <div key={metric.label} className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-3">
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="mt-3 text-xs text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{metric.value}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
