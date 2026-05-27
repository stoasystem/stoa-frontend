import { Activity, Route } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PracticeParentSummary } from '@/types/practice'

export function ParentPracticeSummaryCard({ summary }: { summary: PracticeParentSummary }) {
  return (
    <Card className="border-primary/15 bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <Route className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Learning activity</p>
            <CardTitle className="text-xl">Complete learning activity</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <PracticeParentMetric label="Questions asked" value={`${summary.questionsAsked ?? 2}`} />
          <PracticeParentMetric label="Lessons this week" value={`${summary.lessonsCompletedThisWeek}`} />
          <PracticeParentMetric label="Mistakes reviewed" value={`${summary.mistakesReviewed}`} />
          <PracticeParentMetric label="Practice streak" value={`${summary.practiceStreak} days`} />
          <PracticeParentMetric label="Teacher support" value={`${summary.teacherSupportRequested ?? 1}`} />
        </div>
        {summary.learningActivityNote && (
          <div className="flex gap-3 rounded-lg border bg-[hsl(var(--platform-surface-app))] p-3 text-sm leading-6">
            <Activity className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>{summary.learningActivityNote}</p>
          </div>
        )}
        <div className="space-y-2 text-sm leading-6">
          <p className="text-muted-foreground">
            Your child practised the current school topic and asked for explanations when a step was unclear.
            This helps show where understanding is already strong and where more practice may help.
          </p>
          <p>
            <span className="font-medium">Current Practice topic:</span> {summary.currentPracticePath}
          </p>
          <p>
            <span className="font-medium">Topics practiced:</span> {summary.topicsPracticed.join(', ')}
          </p>
          <p>
            <span className="font-medium">Recommended next topic:</span> {summary.recommendedNextTopic}
          </p>
          <p className="text-muted-foreground">{summary.supportiveNote}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PracticeParentMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
