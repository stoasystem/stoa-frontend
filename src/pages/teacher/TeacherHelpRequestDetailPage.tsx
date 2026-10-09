import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { HelpRequestDetailCard } from '@/components/teacher/HelpRequestDetailCard'
import { PracticeRequestContextCard } from '@/components/teacher/PracticeRequestContextCard'
import { TeacherReplyComposer } from '@/components/teacher/TeacherReplyComposer'
import { TeacherDashboardSkeleton } from '@/components/teacher/TeacherDashboardSkeleton'
import { TeacherRequestTimeline } from '@/components/teacher/TeacherRequestTimeline'
import { TeacherAssistanceSummaryCard } from '@/components/teacher/TeacherAssistanceSummaryCard'
import { AiTeacherToolsPanel } from '@/components/teacher/AiTeacherToolsPanel'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { Button } from '@/components/ui/button'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useAddTeacherHelpRequestNoteMutation } from '@/hooks/teacher/useAddTeacherHelpRequestNoteMutation'
import { useTeacherHelpRequestDetailQuery } from '@/hooks/teacher/useTeacherHelpRequestDetailQuery'
import { useTeacherAssistanceSummaryQuery } from '@/hooks/teacher/useTeacherAssistanceSummaryQuery'
import { useUpdateTeacherHelpRequestMutation } from '@/hooks/teacher/useUpdateTeacherHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { normalizeCurriculumSubjectId } from '@/services/practice/practiceApi'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

const statuses: TeacherHelpStatus[] = ['in_progress', 'resolved']
const statusActionKey: Record<string, string> = {
  in_progress: 'markInProgress',
  resolved: 'markResolved',
}

export function TeacherHelpRequestDetailPage() {
  const { t } = useTranslation('practice')
  const { t: tTeacher } = useTranslation('teacher')
  const { requestId } = useParams()
  const [resolutionNote, setResolutionNote] = useState('')
  const requestQuery = useTeacherHelpRequestDetailQuery(requestId)
  const updateStatus = useUpdateTeacherHelpRequestMutation()
  const addNote = useAddTeacherHelpRequestNoteMutation()
  const assistanceQuery = useTeacherAssistanceSummaryQuery(requestQuery.data?.requestId)
  const curriculumQuery = useCurriculumCatalogQuery({
    subjectId: normalizeCurriculumSubjectId(requestQuery.data?.subject),
    includePreview: true,
  })

  useEffect(() => {
    if (!requestId) return
    trackEvent('teacher_request_opened', { requestId })
  }, [requestId])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={tTeacher('detail.title')}
          description={tTeacher('detail.description')}
          actions={<PageActions secondary={<BackButton label={tTeacher('detail.backLabel')} to="/teacher" />} />}
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: tTeacher('detail.breadcrumbRoot'), to: '/teacher' },
            { label: tTeacher('detail.backLabel'), to: '/teacher' },
            { label: requestQuery.data?.student.name ?? tTeacher('detail.breadcrumbFallback') },
          ]}
        />
        {requestQuery.isLoading && <TeacherDashboardSkeleton showHeader={false} />}
        {requestQuery.isError && <p className="text-sm text-destructive">{tTeacher('detail.loadFailed')}</p>}
        {requestQuery.data && (
          <div className="space-y-6">
            {requestQuery.data.practiceContext && (
              <PracticeRequestContextCard context={requestQuery.data.practiceContext} />
            )}
            <HelpRequestDetailCard request={requestQuery.data} />
            <TeacherAssistanceSummaryCard
              summary={assistanceQuery.data}
              isLoading={assistanceQuery.isLoading}
              isError={assistanceQuery.isError}
            />
            <AiTeacherToolsPanel request={requestQuery.data} />
            <CurriculumRolloutPanel
              title={t('curriculumRollout.teacherTitle')}
              description={t('curriculumRollout.teacherDescription')}
              catalog={curriculumQuery.data}
              isLoading={curriculumQuery.isLoading}
              isError={curriculumQuery.isError}
              contextLabel={t('curriculumRollout.teacherContext')}
            />
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium" htmlFor="resolution-note">
                {tTeacher('detail.resolutionNote')}
              </label>
              <textarea
                id="resolution-note"
                className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder={tTeacher('detail.resolutionNotePlaceholder')}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  disabled={
                    updateStatus.isPending ||
                    !requestId ||
                    (status === 'resolved' && resolutionNote.trim().length === 0)
                  }
                  onClick={() =>
                    requestId &&
                    updateStatus.mutate({
                      requestId,
                      status,
                      resolutionNote: status === 'resolved' ? resolutionNote.trim() : undefined,
                    })
                  }
                >
                  {tTeacher(statusActionKey[status] ?? 'markResolved')}
                </Button>
              ))}
            </div>
            {updateStatus.isError && <p className="text-sm text-destructive">{tTeacher('detail.updateFailed')}</p>}
            <SectionHeader
              title={tTeacher('detail.replyTitle')}
              description={tTeacher('detail.replyDescription')}
            />
            <TeacherReplyComposer
              isSubmitting={addNote.isPending}
              onSubmit={(content, richContent, onSuccess) =>
                requestId && addNote.mutate({ requestId, content, richContent }, { onSuccess })
              }
            />
            <TeacherRequestTimeline notes={requestQuery.data.notes ?? []} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
