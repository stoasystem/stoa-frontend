import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { getPracticeLessonPath } from '@/lib/practiceRoutes'

export function ContinuePracticeCard() {
  const practiceOverviewQuery = usePracticeOverviewQuery()
  const practiceOverview = practiceOverviewQuery.data
  const lesson = practiceOverview?.recommendedLesson

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Start learning</p>
            <CardTitle className="text-xl">Continue your Practice Path</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Pick up where you left off in the current school topic. If a step is unclear, you can ask for an explanation
          in Learning Chat with the practice context attached.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <PracticeMetric label="Next lesson" value={lesson?.title ?? 'Next practice challenge'} />
          <PracticeMetric label="Daily goal" value={practiceOverview?.dailyGoal.label ?? '3 short steps'} />
          <PracticeMetric label="Review" value={`${practiceOverview?.recentMistakes.length ?? 2} mistakes`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="premium-primary-button text-white hover:text-white">
            <Link to={lesson ? getPracticeLessonPath(lesson) : '/practice'}>
              Continue Practice
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/practice/mistakes">Review mistakes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PracticeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
