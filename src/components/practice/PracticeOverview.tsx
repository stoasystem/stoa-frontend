import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DailyGoalCard } from '@/components/practice/DailyGoalCard'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PracticeRoadmap } from '@/components/practice/PracticeRoadmap'
import { StudyStreakCard } from '@/components/practice/StudyStreakCard'
import { SubjectPathCard } from '@/components/practice/SubjectPathCard'
import { Button } from '@/components/ui/button'
import { getPracticeLessonPath, getPracticeLessonPathFromIds } from '@/lib/practiceRoutes'
import type {
  PracticeOverview as PracticeOverviewData,
  PracticeRoadmap as PracticeRoadmapData,
  PracticeRoadmapLesson,
} from '@/types/practice'

export function PracticeOverview({
  overview,
  roadmap,
}: {
  overview: PracticeOverviewData
  roadmap?: PracticeRoadmapData
}) {
  const { t } = useTranslation('practice')
  const navigate = useNavigate()
  const recommendedTopic = overview.topics.find((topic) => topic.id === overview.recommendedLesson.topicId)

  function handleRoadmapLessonClick(lesson: PracticeRoadmapLesson) {
    navigate(getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id))
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--platform-surface-app))_100%)] p-5 shadow-[var(--platform-shadow-soft)]">
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-center">
          <div>
            <p className="brand-section-kicker">Practice Path</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight">
              Short challenges help you start with the next school topic.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Available now: Mathematics / Equations. Each short lesson keeps one learning step clear.
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            {['Linear equations', 'Quadratic equations', 'Linear systems'].map((label, index) => (
              <div
                className="flex items-center justify-between rounded-md border bg-card/80 px-3 py-2"
                key={label}
              >
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground">Unit {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <DailyGoalCard {...overview.dailyGoal} />
        <StudyStreakCard points={overview.progressPoints} streak={overview.studyStreak} />
      </div>
      {roadmap && <PracticeRoadmap onLessonClick={handleRoadmapLessonClick} roadmap={roadmap} />}
      <section className="rounded-lg border border-primary/15 bg-card/90 p-5 shadow-[var(--platform-shadow-soft)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="brand-section-kicker">{t('continuePractice')}</p>
            <h2 className="mt-2 text-2xl font-semibold">{overview.recommendedLesson.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{overview.recommendedLesson.topic}</p>
          </div>
          <Button asChild>
            <Link to={getPracticeLessonPath(overview.recommendedLesson)}>
              {t('continuePractice')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <p className="brand-section-kicker">Available now</p>
          <h2 className="mt-2 text-2xl font-semibold">Mathematics / Equations</h2>
        </div>
        <div className="grid gap-4">
          {overview.subjects.map((subject) => (
            <SubjectPathCard key={subject.id} subject={subject} topic={recommendedTopic} />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <p className="brand-section-kicker">Recent mistakes</p>
          <h2 className="mt-2 text-2xl font-semibold">Review while the step is still fresh</h2>
        </div>
        {overview.recentMistakes.slice(0, 2).map((mistake) => (
          <MistakeReviewCard key={mistake.id} mistake={mistake} />
        ))}
      </section>
    </div>
  )
}
