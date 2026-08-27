/**
 * What a student would otherwise open the dashboard for: the streak they are
 * keeping, the lesson they left unfinished, and the mistakes still worth a
 * second look. It sits above the empty conversation form so it is the first
 * thing seen, and stays out of the way once a conversation is open.
 */
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurriculumProgressQuery } from '@/hooks/practice/useCurriculumProgressQuery'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { useReviewSummaryQuery } from '@/hooks/practice/useReviewQueries'
import { getPracticeLessonPath } from '@/lib/practiceRoutes'

export function TodayStrip() {
  const { t } = useTranslation('practice')
  const progressQuery = useCurriculumProgressQuery()
  const overviewQuery = usePracticeOverviewQuery()

  const reviewQuery = useReviewSummaryQuery()

  const streak = progressQuery.data?.studyStreak ?? 0
  const lesson = overviewQuery.data?.recommendedLesson
  const due = reviewQuery.data?.dueCount ?? 0

  if (progressQuery.isLoading && overviewQuery.isLoading) {
    return null
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-primary/15 bg-card/60 px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Flame className="h-4 w-4 text-primary" aria-hidden="true" />
        {t('review.streak', { count: streak })}
      </span>
      {lesson ? (
        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-sm">
          <Link to={getPracticeLessonPath(lesson)}>
            {t('review.continueLesson', { title: lesson.title })}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
      {due > 0 ? (
        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-sm">
          <Link to="/learn/mistakes">
            {t('review.reviewCount', { count: due })}
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
