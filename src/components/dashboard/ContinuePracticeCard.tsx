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
    <Card className="h-full border-primary/20 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--stoa-brand-burgundy-soft)_/_0.55)_100%)] shadow-[var(--platform-shadow-soft)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Continue Learning</p>
            <CardTitle className="text-xl">Continue your learning path</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Follow a guided sequence of lessons and practice activities. If a step is unclear, you can ask for an explanation with the practice context attached.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <PracticeMetric label="Next lesson" value={lesson?.title ?? 'Next practice challenge'} />
          <PracticeMetric label="Daily goal" value={practiceOverview?.dailyGoal?.label ?? '3 short steps'} />
          <PracticeMetric label="Review" value={`${practiceOverview?.recentMistakes?.length ?? 0} mistakes`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="premium-primary-button text-white hover:text-white">
            <Link to={lesson ? getPracticeLessonPath(lesson) : '/practice'}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/practice/mistakes">Review Mistakes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PracticeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-20 rounded-md border border-primary/10 bg-card/70 px-3 py-3 shadow-sm">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-foreground">{value}</p>
    </div>
  )
}
