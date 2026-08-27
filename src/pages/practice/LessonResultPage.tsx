import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LessonResultSummary } from '@/components/practice/LessonResultSummary'
import { MistakeReviewCard } from '@/components/practice/MistakeReviewCard'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { PracticeLessonResult } from '@/types/practice'

export function LessonResultPage() {
  const { t } = useTranslation('practice')
  const location = useLocation()
  const result = useMemo(() => {
    const state = location.state as { result?: PracticeLessonResult } | null
    return state?.result ?? null
  }, [location.state])

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <PageHeader
          eyebrow="Lesson complete"
          title={t('path.reviewSession')}
          description="A concise summary of the practice session and the steps worth reviewing."
        />
        {result === null ? (
          <div className="space-y-4 rounded-lg border border-border/70 bg-card/95 p-6">
            <p className="text-sm text-muted-foreground">
              This summary is shown right after you finish a lesson, and there is no finished
              lesson to show yet.
            </p>
            <Button asChild>
              <Link to="/practice">Go to practice</Link>
            </Button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
