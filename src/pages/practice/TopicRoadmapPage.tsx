import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PracticeRoadmap } from '@/components/practice/PracticeRoadmap'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Button } from '@/components/ui/button'
import { usePracticeRoadmapQuery } from '@/hooks/practice/usePracticeRoadmapQuery'
import { usePracticeSubjectsQuery } from '@/hooks/practice/usePracticeSubjectsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import {
  defaultPracticeTopicId,
  getPracticeLessonPathFromIds,
} from '@/lib/practiceRoutes'
import type { PracticeRoadmapLesson } from '@/types/practice'

export function TopicRoadmapPage() {
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const resolvedSubjectId = subjectId ?? 'mathematics'
  const resolvedTopicId = topicId ?? defaultPracticeTopicId
  const roadmapQuery = usePracticeRoadmapQuery(resolvedSubjectId, resolvedTopicId)
  const subjectsQuery = usePracticeSubjectsQuery()
  const subject = subjectsQuery.data?.items.find((item) => item.id === resolvedSubjectId || (resolvedSubjectId === 'math' && item.id === 'mathematics'))
  const roadmap = roadmapQuery.data

  function handleRoadmapLessonClick(lesson: PracticeRoadmapLesson) {
    navigate(getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id))
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            className="mb-0"
            eyebrow="Practice topic"
            title={roadmap ? `${subject?.name ?? 'Mathematics'}: ${roadmap.topic.title}` : 'Practice roadmap'}
            description="Follow your practice path. Complete short lessons and ask for an explanation when a step is unclear."
          />
          <Button asChild variant="outline">
            <Link to="/practice">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Practice
            </Link>
          </Button>
        </div>
        {roadmapQuery.isLoading && <PageSkeleton rows={4} />}
        {roadmapQuery.isError && <p className="text-sm text-destructive">Practice roadmap is unavailable.</p>}
        {roadmap && <PracticeRoadmap onLessonClick={handleRoadmapLessonClick} roadmap={roadmap} />}
      </PageContainer>
    </DashboardLayout>
  )
}
