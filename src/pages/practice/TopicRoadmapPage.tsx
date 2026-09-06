import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpenCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PracticeRoadmap } from '@/components/practice/PracticeRoadmap'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { InlineUploadPanel } from '@/features/uploads/components/InlineUploadPanel'
import { saveUploadHandoff } from '@/features/uploads/utils/uploadHandoff'
import type { UploadAttachment } from '@/features/uploads/types/uploads'
import { usePracticeOverviewQuery } from '@/hooks/practice/usePracticeOverviewQuery'
import { usePracticeRoadmapQuery } from '@/hooks/practice/usePracticeRoadmapQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import {
  defaultPracticeTopicId,
  getPracticeLessonPathFromIds,
} from '@/lib/practiceRoutes'
import type { PracticeSubject, PracticeTopic, PracticeRoadmapLesson } from '@/types/practice'

export function TopicRoadmapPage() {
  const { t } = useTranslation(['practice', 'uploads'])
  const { subjectId, topicId } = useParams()
  const navigate = useNavigate()
  const resolvedSubjectId = subjectId ?? 'mathematics'
  const resolvedTopicId = topicId ?? defaultPracticeTopicId
  const overviewQuery = usePracticeOverviewQuery()
  const overview = overviewQuery.data
  const subject = overview?.subjects.find((item) => item.id === resolvedSubjectId || (resolvedSubjectId === 'math' && item.id === 'mathematics'))
  const topic = overview?.topics.find((item) => item.subjectId === subject?.id && item.id === resolvedTopicId)
  const canOpenRoadmap = topic?.status === 'available'
  const roadmapQuery = usePracticeRoadmapQuery(
    canOpenRoadmap ? subject?.id : undefined,
    canOpenRoadmap ? topic?.id : undefined,
  )
  const roadmap = roadmapQuery.data

  function handleRoadmapLessonClick(lesson: PracticeRoadmapLesson) {
    navigate(getPracticeLessonPathFromIds(lesson.subjectId, lesson.topicId, lesson.id))
  }

  function askWithPracticeUpload(attachments: UploadAttachment[]) {
    const uploadContext = {
      source: 'practice-upload' as const,
      title: t('uploads:learning.uploadOwnQuestionTitle'),
      description: t('uploads:learning.uploadOwnQuestionDescription'),
      prompt: t('uploads:chat.defaultAttachmentPrompt'),
      returnTo: `/practice/${resolvedSubjectId}/${resolvedTopicId}`,
      attachments,
    }
    saveUploadHandoff(uploadContext)
    navigate('/chat?source=practice-upload', { state: { uploadContext } })
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            className="mb-0"
            eyebrow={t('ui.practiceSubject')}
            title={subject ? t('ui.practicePathWithSubject', { subject: subject.name }) : t('ui.practicePath')}
            description={topic?.description ?? subject?.description ?? t('roadmap.pageDescription')}
          />
          <Button asChild variant="outline">
            <Link to="/practice">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('ui.subjectsLink')}
            </Link>
          </Button>
        </div>
        {overviewQuery.isLoading && <PageSkeleton rows={4} />}
        {overviewQuery.isError && <p className="text-sm text-destructive">{t('ui.practiceOverviewUnavailable')}</p>}
        {overview && !canOpenRoadmap && (
          <PreparedSubjectState subject={subject} topic={topic} />
        )}
        {overview && canOpenRoadmap && (
          <div className="space-y-8">
            {roadmapQuery.isLoading && <PageSkeleton rows={4} />}
            {roadmapQuery.isError && <p className="text-sm text-destructive">{t('ui.roadmapUnavailable')}</p>}
            {roadmap && <PracticeRoadmap onLessonClick={handleRoadmapLessonClick} roadmap={roadmap} />}
            <InlineUploadPanel
              context="practice_path"
              title={t('ui.haveQuestion')}
              description={t('ui.uploadWhilePractising2')}
              sourceOptions={{
                sourcePage: `/practice/${resolvedSubjectId}/${resolvedTopicId}`,
                sourceEntityId: resolvedTopicId,
              }}
              compact
              onAskLearningAssistant={askWithPracticeUpload}
            />
            <section className="space-y-4">
              <SectionHeader
                title={t('ui.reviewWork')}
                description={t('path.roadmapHint')}
              />
              {overview.recentMistakes.slice(0, 2).map((mistake) => (
                <MistakeReviewCard key={mistake.id} mistake={mistake} />
              ))}
            </section>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}

function PreparedSubjectState({
  subject,
  topic,
}: {
  subject?: PracticeSubject
  topic?: PracticeTopic
}) {
  const { t } = useTranslation('practice')
  return (
    <Card className="border-dashed border-primary/25 bg-card/85 shadow-[var(--platform-shadow-card)]">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
              <BookOpenCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="brand-section-kicker mt-5">{t('ui.subjectPathKicker')}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              {t('ui.subjectPathNotAvailable', { subject: subject?.name ?? t('ui.subjectsLink') })}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t('ui.subjectPathNotAvailableBody')}
            </p>
          </div>
          <div className="w-full rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4 text-sm lg:max-w-xs">
            <p className="font-medium text-foreground">{topic?.title ?? t('ui.topicNotSelected')}</p>
            <p className="mt-2 leading-6 text-muted-foreground">
              {topic?.description ?? subject?.description ?? t('ui.chooseAnotherSubject')}
            </p>
          </div>
        </div>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/practice">{t('ui.backToSubjects')}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
