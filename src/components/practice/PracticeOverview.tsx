import { BookOpenCheck, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from '@/components/common/SectionHeader'
import { DailyGoalCard } from '@/components/practice/DailyGoalCard'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PracticeRoadmap } from '@/components/practice/PracticeRoadmap'
import { StudyStreakCard } from '@/components/practice/StudyStreakCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getPracticeLessonPathFromIds } from '@/lib/practiceRoutes'
import type {
  PracticeOverview as PracticeOverviewData,
  PracticeRoadmap as PracticeRoadmapData,
  PracticeRoadmapLesson,
  PracticeSubject,
  PracticeTopic,
} from '@/types/practice'

export function PracticeOverview({
  onSubjectSelect,
  overview,
  roadmap,
  selectedSubjectId,
}: {
  onSubjectSelect: (subjectId: string) => void
  overview: PracticeOverviewData
  roadmap?: PracticeRoadmapData
  selectedSubjectId?: string
}) {
  const navigate = useNavigate()
  const selectedSubject = overview.subjects.find((subject) => subject.id === selectedSubjectId)
  const selectedTopic = selectedSubject
    ? overview.topics.find((topic) => topic.subjectId === selectedSubject.id)
    : undefined
  const selectedTopicAvailable = selectedTopic?.status === 'available'

  function handleRoadmapLessonClick(lesson: PracticeRoadmapLesson) {
    navigate(getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id))
  }

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
                isSelected={subject.id === selectedSubjectId}
                isAvailable={overview.topics.some(
                  (item) => item.subjectId === subject.id && item.status === 'available',
                )}
                key={subject.id}
                onSelect={() => onSubjectSelect(subject.id)}
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

      {!selectedSubject && (
        <section className="rounded-lg border border-dashed border-primary/25 bg-card/70 p-6 text-center shadow-[var(--platform-shadow-card)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Select a subject to open its Practice Path</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Path details stay hidden until a subject is selected.
          </p>
        </section>
      )}

      {selectedSubject && (
        <section className="space-y-5">
          <SectionHeader
            title={`${selectedSubject.name} Practice Path`}
            description={selectedTopic?.description ?? selectedSubject.description}
          />
          {!selectedTopicAvailable ? (
            <div className="rounded-lg border border-dashed border-primary/25 bg-card/75 p-6 text-sm leading-6 text-muted-foreground shadow-[var(--platform-shadow-card)]">
              <h3 className="text-lg font-semibold text-foreground">{selectedSubject.name} path is being prepared</h3>
              <p className="mt-2">
                This subject is selectable so students can see planned school coverage, but full Practice Path
                lessons are not open yet. Choose Mathematics to use the available demo path today.
              </p>
            </div>
          ) : roadmap ? (
            <PracticeRoadmap onLessonClick={handleRoadmapLessonClick} roadmap={roadmap} />
          ) : (
            <div className="rounded-lg border border-primary/15 bg-card/80 p-5 text-sm text-muted-foreground shadow-[var(--platform-shadow-card)]">
              Loading the selected subject path...
            </div>
          )}
        </section>
      )}

      {selectedSubject && selectedTopicAvailable && (overview.recentMistakes ?? []).length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Review work"
            description="Recent mistakes and follow-up practice for the selected learning path."
          />
          {(overview.recentMistakes ?? []).slice(0, 2).map((mistake) => (
            <MistakeReviewCard key={mistake.id} mistake={mistake} />
          ))}
        </section>
      )}
    </div>
  )
}

function SubjectSelectionCard({
  isSelected,
  isAvailable,
  onSelect,
  subject,
  topic,
}: {
  isSelected: boolean
  isAvailable: boolean
  onSelect: () => void
  subject: PracticeSubject
  topic?: PracticeTopic
}) {
  return (
    <Card
      className={cn(
        'border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)] transition-colors',
        isSelected && 'border-primary/35 bg-[hsl(var(--stoa-brand-burgundy-soft)_/_0.42)]',
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
            className={cn('shrink-0', isSelected && 'premium-primary-button text-white hover:text-white')}
            onClick={onSelect}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
          >
            {isSelected ? 'Selected' : isAvailable ? 'Select subject' : 'Preview subject'}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
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
