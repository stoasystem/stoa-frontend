import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { LessonResultSummary } from '@/components/practice/LessonResultSummary'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { completeMockLesson } from '@/data/mockPractice'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { PracticeLessonResult } from '@/types/practice'

export function LessonResultPage() {
  const { lessonId } = useParams()
  const location = useLocation()
  const result = useMemo(() => {
    const state = location.state as { result?: PracticeLessonResult } | null
    return state?.result ?? completeMockLesson(lessonId ?? 'lesson-linear-1')
  }, [lessonId, location.state])

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Lesson complete"
          title="Review the session"
          description="A concise summary of the practice session and the steps worth reviewing."
        />
        <LessonResultSummary result={result} />
        {result.mistakes.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="brand-section-kicker">Mistakes review</p>
              <h2 className="mt-2 text-2xl font-semibold">Worth one more look</h2>
            </div>
            {result.mistakes.map((mistake) => (
              <MistakeReviewCard key={mistake.id} mistake={mistake} />
            ))}
          </section>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
