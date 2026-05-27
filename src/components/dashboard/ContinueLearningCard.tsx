import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'

export function ContinueLearningCard() {
  const practiceOverviewQuery = usePracticeOverviewQuery()
  const practiceOverview = practiceOverviewQuery.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Continue Practice</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        {practiceOverview ? (
          <div className="space-y-3">
            <p>
              Current Practice topic: {practiceOverview.recommendedLesson.topic}. Next lesson:{' '}
              {practiceOverview.recommendedLesson.title}. Today&apos;s goal is{' '}
              {practiceOverview.dailyGoal.label.toLowerCase()}, with a {practiceOverview.studyStreak}
              -day study streak.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <PracticeSignal label="Daily goal" value={practiceOverview.dailyGoal.label} />
              <PracticeSignal label="Study streak" value={`${practiceOverview.studyStreak} days`} />
              <PracticeSignal label="Recent mistakes" value={`${practiceOverview.recentMistakes.length} to review`} />
            </div>
          </div>
        ) : (
          <p>
            Your fastest path is to start a short Practice challenge, compare the explanation with your class
            notes, then request teacher support if the explanation still feels unclear.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild className="premium-primary-button text-white hover:text-white">
            <Link to="/practice">Continue Practice</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat">Ask a question</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/learning-history">View history</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PracticeSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-medium text-foreground">{value}</p>
    </div>
  )
}
