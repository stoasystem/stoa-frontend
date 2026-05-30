import { ArrowRight, BookOpen, CheckCircle2, Circle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DailyGoalCard } from '@/components/practice/DailyGoalCard'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PracticeRoadmap } from '@/components/practice/PracticeRoadmap'
import { StudyStreakCard } from '@/components/practice/StudyStreakCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPracticeLessonPath, getPracticeLessonPathFromIds, getPracticeTopicPath } from '@/lib/practiceRoutes'
import type {
  PracticeOverview as PracticeOverviewData,
  PracticeRoadmap as PracticeRoadmapData,
  PracticeRoadmapLesson,
  PracticeTopic,
} from '@/types/practice'

function TopicCard({ topic, isRecommended }: { topic: PracticeTopic; isRecommended?: boolean }) {
  const path = getPracticeTopicPath(topic.subjectId, topic.id)
  const pct = topic.progress ?? 0
  const isDone = pct === 100

  return (
    <Card className="group relative border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)] transition-all hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {isDone
                ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--stoa-brand-burgundy))]" />
                : <Circle className="h-5 w-5 text-muted-foreground/40" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold leading-tight">{topic.title}</h3>
                {isRecommended && (
                  <Badge variant="secondary" className="text-[10px]">Up next</Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {topic.description}
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant={isRecommended ? 'default' : 'outline'} className="shrink-0">
            <Link to={path}>
              {isDone ? 'Review' : 'Start'}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% completed</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(var(--stoa-brand-burgundy-soft))]">
            <div
              className="h-full rounded-full bg-[hsl(var(--stoa-brand-burgundy))] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PracticeOverview({
  overview,
  roadmap,
}: {
  overview: PracticeOverviewData
  roadmap?: PracticeRoadmapData
}) {
  const { t } = useTranslation('practice')
  const navigate = useNavigate()
  const recommendedTopicId = overview.recommendedLesson.topicId

  function handleRoadmapLessonClick(lesson: PracticeRoadmapLesson) {
    navigate(getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id))
  }

  return (
    <div className="space-y-8">
      {/* ── Continue banner ── */}
      <section className="rounded-lg border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--stoa-brand-card))_0%,hsl(var(--platform-surface-app))_100%)] p-5 shadow-[var(--platform-shadow-soft)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="brand-section-kicker">{t('continuePractice')}</p>
            <h2 className="mt-2 text-2xl font-semibold">{overview.recommendedLesson.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{overview.recommendedLesson.topic}</p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to={getPracticeLessonPath(overview.recommendedLesson)}>
              {t('continuePractice')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Stats row ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {overview.dailyGoal && <DailyGoalCard {...overview.dailyGoal} />}
        <StudyStreakCard points={overview.progressPoints} streak={overview.studyStreak} />
      </div>

      {/* ── Roadmap for recommended topic ── */}
      {roadmap && (
        <PracticeRoadmap onLessonClick={handleRoadmapLessonClick} roadmap={roadmap} />
      )}

      {/* ── All topics ── */}
      {overview.topics.length > 0 && (
        <section className="space-y-4">
          <div>
            <p className="brand-section-kicker">All topics</p>
            <h2 className="mt-2 text-2xl font-semibold">ZAP preparation path</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All {overview.topics.length} topics for the Zentrale Aufnahmeprüfung
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {overview.topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                isRecommended={topic.id === recommendedTopicId}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Recent mistakes ── */}
      {(overview.recentMistakes ?? []).length > 0 && (
        <section className="space-y-4">
          <div>
            <p className="brand-section-kicker">Recent mistakes</p>
            <h2 className="mt-2 text-2xl font-semibold">Review while the step is still fresh</h2>
          </div>
          {overview.recentMistakes.slice(0, 3).map((mistake) => (
            <MistakeReviewCard key={mistake.id} mistake={mistake} />
          ))}
        </section>
      )}

      {/* ── Subjects (secondary) ── */}
      {overview.subjects.length > 0 && overview.topics.length === 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="brand-section-kicker">Available subjects</p>
          </div>
          <div className="grid gap-4">
            {overview.subjects.map((subject) => (
              <Card key={subject.id} className="border-primary/10 bg-card/95 shadow-[var(--platform-shadow-soft)]">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{subject.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>
                    </div>
                    <Button asChild variant="outline">
                      <Link to={getPracticeTopicPath(subject.id)}>
                        Explore <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
