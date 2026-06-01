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
  return (
    <div className="space-y-8">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <SectionHeader
            title="Choose a subject"
            description="Start by choosing the school subject you want to practise today."
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
            title="Today"
            description="Keep the practice rhythm visible before choosing a path."
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
  const subjectPath = getPracticeTopicPath(subject.id, topic?.id)

  return (
    <Card
      className={cn(
        'border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)] transition-colors hover:border-primary/30',
        isAvailable && 'border-primary/20',
      )}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="brand-section-kicker">Subject</p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight">{subject.name}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subject.description}</p>
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
                <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-2.5 py-1">
                  {topic.status === 'available' ? 'Available topic' : 'Coming soon'}: {topic.title}
                </span>
              )}
            </div>
          </div>
          <Button
            asChild
            className={cn('shrink-0', isAvailable && 'premium-primary-button text-white hover:text-white')}
            variant={isAvailable ? 'default' : 'outline'}
          >
            <Link to={subjectPath}>
              {isAvailable ? 'Open subject' : 'View subject'}
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
        <p className="mt-2 text-xs text-muted-foreground">{subject.progress}% subject progress</p>
      </CardContent>
    </Card>
  )
}
