import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DailyGoalCard } from '@/components/practice/DailyGoalCard'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { StudyStreakCard } from '@/components/practice/StudyStreakCard'
import { SubjectPathCard } from '@/components/practice/SubjectPathCard'
import { Button } from '@/components/ui/button'
import type { PracticeOverview as PracticeOverviewData } from '@/types/practice'

export function PracticeOverview({ overview }: { overview: PracticeOverviewData }) {
  const { t } = useTranslation('practice')

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <DailyGoalCard {...overview.dailyGoal} />
        <StudyStreakCard points={overview.progressPoints} streak={overview.studyStreak} />
      </div>
      <section className="rounded-lg border border-primary/15 bg-card/80 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="brand-section-kicker">{t('continuePractice')}</p>
            <h2 className="mt-2 text-2xl font-semibold">{overview.recommendedLesson.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{overview.recommendedLesson.topic}</p>
          </div>
          <Button asChild>
            <Link to={`/practice/${overview.recommendedLesson.subjectId}/lessons/${overview.recommendedLesson.id}`}>
              {t('continuePractice')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <p className="brand-section-kicker">Recommended topics</p>
          <h2 className="mt-2 text-2xl font-semibold">Subject paths</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {overview.subjects.map((subject) => (
            <SubjectPathCard key={subject.id} subject={subject} />
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
