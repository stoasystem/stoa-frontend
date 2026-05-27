import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPracticeMistakeLessonPath, getPracticeResultTopicPath } from '@/lib/practiceRoutes'
import type { PracticeChatContext, PracticeLessonResult } from '@/types/practice'

export function LessonResultSummary({ result }: { result: PracticeLessonResult }) {
  const { t } = useTranslation('practice')
  const reviewContext = result.mistakes[0]
    ? buildPracticeChatContext(result.mistakes[0])
    : null

  return (
    <Card className="border-primary/15 bg-card/95">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
            <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">{t('lessonComplete')}</p>
            <CardTitle className="text-3xl">Practice summary</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the steps you found difficult while the method is still fresh.
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          <ResultMetric label="Correct" value={`${result.correctCount}/${result.totalCount}`} />
          <ResultMetric label="Time" value={`${Math.round(result.timeSpentSeconds / 60)} min`} />
          <ResultMetric label="Points" value={`+${result.progressPoints}`} />
          <ResultMetric label="Streak" value={`${result.studyStreak} days`} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={getPracticeResultTopicPath(result)}>{t('continuePractice')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/practice/mistakes">{t('reviewMistakes')}</Link>
          </Button>
          {reviewContext && (
            <Button asChild variant="outline">
              <Link
                to="/chat"
                state={{
                  practiceContext: reviewContext,
                  prompt: 'Can you explain this step?',
                }}
              >
                Ask about this step
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function buildPracticeChatContext(
  mistake: PracticeLessonResult['mistakes'][number],
): PracticeChatContext {
  return {
    source: 'practice',
    subjectId: mistake.subjectId,
    gradeLevel: mistake.gradeLevel,
    topicId: mistake.topicId,
    lessonId: mistake.lessonId,
    challengeId: mistake.challengeId,
    challengePrompt: mistake.prompt,
    studentAnswer: mistake.studentAnswer,
    correctAnswer: mistake.correctAnswer,
    attempts: 2,
    hintViewed: true,
    learningChatExplanationRequested: true,
    topic: mistake.topic,
    returnTo: getPracticeMistakeLessonPath(mistake),
  }
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4">
      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
