import { LibraryBig, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuestionBankOverviewQuery } from '@/hooks/questionBank/useQuestionBankOverviewQuery'
import { getQuestionBankMistakesPath } from '@/lib/questionBankRoutes'

export function QuestionBankCard() {
  const overviewQuery = useQuestionBankOverviewQuery()
  const overview = overviewQuery.data

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <LibraryBig className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Practice Library</p>
            <CardTitle className="text-xl">Choose exercises by topic</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Choose exercises by subject, topic, and difficulty when you want flexible practice outside the guided Practice Path.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Metric label="Subjects" value={`${overview?.subjects.length ?? 4}`} />
          <Metric label="Review" value={`${overview?.mistakesToReview ?? 3} mistakes`} />
          <Metric label="Saved" value={`${overview?.savedSets.length ?? 1} sets`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/question-bank">Open Practice Library</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={getQuestionBankMistakesPath()}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Review Mistakes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
