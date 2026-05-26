import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PracticePathMap } from '@/components/practice/PracticePathMap'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/PageSkeleton'
import { Button } from '@/components/ui/button'
import { useSubjectPathQuery } from '@/hooks/practice/useSubjectPathQuery'
import { usePracticeSubjectsQuery } from '@/hooks/practice/usePracticeSubjectsQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'

export function SubjectPathPage() {
  const { subjectId } = useParams()
  const pathQuery = useSubjectPathQuery(subjectId)
  const subjectsQuery = usePracticeSubjectsQuery()
  const subject = subjectsQuery.data?.items.find((item) => item.id === subjectId)

  return (
    <DashboardLayout>
      <PageContainer className="space-y-8 p-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            className="mb-0"
            eyebrow="Subject path"
            title={subject?.name ?? 'Practice path'}
            description={subject?.description ?? 'Follow the next available lesson and keep the session short.'}
          />
          <Button asChild variant="outline">
            <Link to="/practice">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Practice
            </Link>
          </Button>
        </div>
        {pathQuery.isLoading && <PageSkeleton rows={4} />}
        {pathQuery.isError && <p className="text-sm text-destructive">Subject path is unavailable.</p>}
        {pathQuery.data && <PracticePathMap units={pathQuery.data.units} />}
      </PageContainer>
    </DashboardLayout>
  )
}
