import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeader } from '@/components/common/SectionHeader'
import { DailyGoalCard } from '@/components/practice/DailyGoalCard'
import { StudyStreakCard } from '@/components/practice/StudyStreakCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getPracticeTopicPath } from '@/lib/practiceRoutes'
import type {
  PracticeOverview as PracticeOverviewData,
  PracticeSubject,
  PracticeTopic,
} from '@/types/practice'

export function PracticeOverview({
  overview,
}: {
  overview: PracticeOverviewData
}) {
  const { t } = useTranslation('practice')
  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <SectionHeader
            title={t('ui.chooseSubject')}
            description={t('path.chooseSubject')}
          />
          <div className="grid gap-4 md:grid-cols-2">
            {overview.subjects.map((subject) => (
              <SubjectSelectionCard
                isAvailable={overview.topics.some(
                  (item) => item.subjectId === subject.id && item.status === 'available',
                )}
                key={subject.id}
                subject={subject}
                topic={overview.topics.find((item) => item.subjectId === subject.id)}
              />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <SectionHeader
            title={t('learn.today')}
            description={t('path.rhythm')}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {overview.dailyGoal && <DailyGoalCard {...overview.dailyGoal} />}
            <StudyStreakCard points={overview.progressPoints} streak={overview.studyStreak} />
          </div>
        </aside>
      </section>
    </div>
  )
}

function SubjectSelectionCard({
  isAvailable,
  subject,
  topic,
}: {
  isAvailable: boolean
  subject: PracticeSubject
  topic?: PracticeTopic
}) {
  const { t } = useTranslation('practice')
  const subjectPath = getPracticeTopicPath(subject.id, topic?.id)

  return (
    <Card
      className={cn(
        'border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)] transition-colors hover:border-primary/30',
        isAvailable && 'border-primary/20',
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4">
          <div className="min-w-0">
            <p className="brand-section-kicker">{t('learn.subjectKicker')}</p>
            <h3 className="mt-2 hyphens-auto break-words text-2xl font-semibold leading-tight">
              {subject.name}
            </h3>
            <p
              className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-muted-foreground"
              title={subject.description}
            >
              {subject.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {subject.gradeLevels.map((gradeLevel) => (
                <span
                  className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1"
                  key={gradeLevel.id}
                >
                  {gradeLevel.label}
                </span>
              ))}
              {topic && (
                <span className="max-w-full break-words rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">
                  {topic.status === 'available'
                    ? t('learn.topicAvailable')
                    : t('learn.topicComingSoon')}
                  : {topic.title}
                </span>
              )}
            </div>
          </div>
          <Button
            asChild
            className={cn(
              'w-full shrink-0 sm:w-auto sm:self-start',
              isAvailable && 'premium-primary-button text-white hover:text-white',
            )}
            variant={isAvailable ? 'default' : 'outline'}
          >
            <Link to={subjectPath}>
              {isAvailable ? t('learn.openSubject') : t('learn.viewSubject')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))]">
          <div
            className="h-full rounded-full bg-[hsl(var(--stoa-brand-burgundy))]"
            style={{ width: `${subject.progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('learn.subjectProgress', { percent: subject.progress })}
        </p>
      </CardContent>
    </Card>
  )
}
