import { CircleAlert, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherAssistanceSummary } from '@/types/tutor'

type Props = {
  summary?: TeacherAssistanceSummary
  isLoading: boolean
  isError: boolean
}

export function TeacherAssistanceSummaryCard({ summary, isLoading, isError }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              Teacher assistance seed
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              A bounded summary for tutor preparation, not automatic exercise generation.
            </p>
          </div>
          {summary && <Badge variant="secondary">{summary.sourceCount} sources</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Preparing summary seed...</p>}
        {isError && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <CircleAlert className="h-4 w-4" aria-hidden="true" />
            Summary seed is unavailable for this request.
          </p>
        )}
        {!isLoading && !isError && !summary && (
          <p className="text-sm text-muted-foreground">No summary seed is available yet.</p>
        )}
        {summary && (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              <SummaryBlock title="Student context" value={summary.studentContextSummary} />
              <SummaryBlock title="Suggested focus" value={summary.suggestedFocus} />
            </div>
            <SummaryBlock title="Question" value={summary.questionSummary || 'No question text available.'} />
            <SummaryBlock title="Assistant answer" value={summary.aiAnswerSummary || 'No assistant answer available.'} />
            <div className="flex flex-wrap gap-2">
              {summary.weakTopics.length === 0 && (
                <Badge variant="outline">No weak topic evidence</Badge>
              )}
              {summary.weakTopics.map((topic) => (
                <Badge key={topic} variant="outline">{topic}</Badge>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6">{value}</p>
    </div>
  )
}
