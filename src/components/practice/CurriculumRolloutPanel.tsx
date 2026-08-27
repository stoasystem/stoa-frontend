import { useTranslation } from 'react-i18next'
import { BookOpenCheck, CircleAlert, Layers3, ListChecks, Signal } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CurriculumCatalog, CurriculumProgressSummary } from '@/types/practice'

type Props = {
  title?: string
  description?: string
  catalog?: CurriculumCatalog
  progress?: CurriculumProgressSummary
  isLoading: boolean
  isError: boolean
  contextLabel?: string
  weakTopicLabels?: string[]
}

export function CurriculumRolloutPanel({
  title = 'Curriculum rollout',
  description = 'Active curriculum coverage, lesson bank depth, and progress signals.',
  catalog,
  progress,
  isLoading,
  isError,
  contextLabel = 'Curriculum',
  weakTopicLabels = [],
}: Props) {
  const { t } = useTranslation('practice')
  const activeSubjects = catalog?.subjects.filter((subject) => subject.rolloutState === 'active') ?? []
  const activeLessons = catalog?.lessons.filter((lesson) => lesson.rolloutState === 'active') ?? []
  const totalExercises = activeLessons.reduce((sum, lesson) => sum + lesson.exerciseCount, 0)
  const visibleWeakTopics = weakTopicLabels.length > 0
    ? weakTopicLabels
    : progress?.weakTopics.map((topic) => topic.topicId.replace(/-/g, ' ')) ?? []

  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <Card className="border-primary/15 bg-card/95">
        <CardContent className="space-y-5 p-5">
          {isLoading && <p className="text-sm text-muted-foreground">Loading curriculum coverage...</p>}
          {isError && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              Curriculum coverage is unavailable right now.
            </p>
          )}
          {!isLoading && !isError && catalog && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="brand-section-kicker">{contextLabel}</p>
                  <p className="mt-2 text-lg font-semibold">Math, physics, German, and English rollout</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Active content is shown in normal student flows. Draft, reviewed, and archived content remains hidden unless an authorized teacher or admin previews it.
                  </p>
                </div>
                <Badge variant="secondary">{catalog.source.replace(/_/g, ' ')}</Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <RolloutMetric icon={BookOpenCheck} label={t('ui.activeSubjects')} value={String(activeSubjects.length)} />
                <RolloutMetric icon={Layers3} label="Units" value={String(catalog.units.length)} />
                <RolloutMetric icon={ListChecks} label="Lessons" value={String(activeLessons.length)} />
                <RolloutMetric icon={Signal} label="Exercises" value={String(totalExercises)} />
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Rollout subjects</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeSubjects.map((subject) => (
                      <div key={subject.id} className="rounded-md border border-border/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{subject.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {subject.gradeLevels.map((level) => level.label).join(', ') ||
                                'All active grades'}
                            </p>
                          </div>
                          <Badge variant="outline">{subject.rolloutState}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Progress signals</p>
                  <div className="rounded-md border border-border/70 p-3">
                    <p className="text-xs text-muted-foreground">Completed lessons</p>
                    <p className="mt-1 text-xl font-semibold">{progress?.completedLessons ?? 0}</p>
                  </div>
                  <div className="rounded-md border border-border/70 p-3">
                    <p className="text-xs text-muted-foreground">Weak curriculum areas</p>
                    {visibleWeakTopics.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No weak area evidence yet.</p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {visibleWeakTopics.slice(0, 4).map((topic) => (
                          <Badge key={topic} variant="outline">{topic}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {activeLessons.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Lesson bank sample</p>
                  <div className="divide-y divide-border/70 rounded-md border border-border/70">
                    {activeLessons.slice(0, 5).map((lesson) => (
                      <div key={lesson.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lesson.subjectId} / {lesson.topicId} / {lesson.estimatedMinutes} min
                          </p>
                        </div>
                        <Badge variant="secondary">{lesson.exerciseCount} exercises</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function RolloutMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpenCheck
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-border/70 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
