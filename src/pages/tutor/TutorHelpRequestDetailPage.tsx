import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { SectionHeader } from '@/components/common/SectionHeader'
import { HelpRequestDetailCard } from '@/components/tutor/HelpRequestDetailCard'
import { PracticeRequestContextCard } from '@/components/tutor/PracticeRequestContextCard'
import { TeacherReplyComposer } from '@/components/tutor/TeacherReplyComposer'
import { TutorDashboardSkeleton } from '@/components/tutor/TutorDashboardSkeleton'
import { TutorRequestTimeline } from '@/components/tutor/TutorRequestTimeline'
import { TeacherAssistanceSummaryCard } from '@/components/tutor/TeacherAssistanceSummaryCard'
import { AiTeacherToolsPanel } from '@/components/tutor/AiTeacherToolsPanel'
import { CurriculumRolloutPanel } from '@/components/practice/CurriculumRolloutPanel'
import { Button } from '@/components/ui/button'
import { useCurriculumCatalogQuery } from '@/hooks/practice/useCurriculumCatalogQuery'
import { useAddTutorHelpRequestNoteMutation } from '@/hooks/tutor/useAddTutorHelpRequestNoteMutation'
import { useTutorHelpRequestDetailQuery } from '@/hooks/tutor/useTutorHelpRequestDetailQuery'
import { useTutorAssistanceSummaryQuery } from '@/hooks/tutor/useTutorAssistanceSummaryQuery'
import { useUpdateTutorHelpRequestMutation } from '@/hooks/tutor/useUpdateTutorHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { normalizeCurriculumSubjectId } from '@/services/practice/practiceApi'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

const statuses: TeacherHelpStatus[] = ['in_progress', 'resolved']
const statusActionKey: Record<string, string> = {
  in_progress: 'markInProgress',
  resolved: 'markResolved',
}

export function TutorHelpRequestDetailPage() {
  const { t } = useTranslation('practice')
  const { t: tTutor } = useTranslation('tutor')
  const { requestId } = useParams()
  const [resolutionNote, setResolutionNote] = useState('')
  const requestQuery = useTutorHelpRequestDetailQuery(requestId)
  const updateStatus = useUpdateTutorHelpRequestMutation()
  const addNote = useAddTutorHelpRequestNoteMutation()
  const assistanceQuery = useTutorAssistanceSummaryQuery(requestQuery.data?.requestId)
  const curriculumQuery = useCurriculumCatalogQuery({
    subjectId: normalizeCurriculumSubjectId(requestQuery.data?.subject),
    includePreview: true,
  })

  useEffect(() => {
    if (!requestId) return
    trackEvent('tutor_request_opened', { requestId })
  }, [requestId])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title={tTutor('detail.title')}
          description={tTutor('detail.description')}
          actions={<PageActions secondary={<BackButton label={tTutor('detail.backLabel')} to="/tutor" />} />}
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: tTutor('detail.breadcrumbRoot'), to: '/tutor' },
            { label: tTutor('detail.backLabel'), to: '/tutor' },
            { label: requestQuery.data?.student.name ?? tTutor('detail.breadcrumbFallback') },
          ]}
        />
        {requestQuery.isLoading && <TutorDashboardSkeleton showHeader={false} />}
        {requestQuery.isError && <p className="text-sm text-destructive">{tTutor('detail.loadFailed')}</p>}
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
              title={t('curriculumRollout.tutorTitle')}
              description={t('curriculumRollout.tutorDescription')}
              catalog={curriculumQuery.data}
              isLoading={curriculumQuery.isLoading}
              isError={curriculumQuery.isError}
              contextLabel={t('curriculumRollout.tutorContext')}
            />
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium" htmlFor="resolution-note">
                {tTutor('detail.resolutionNote')}
              </label>
              <textarea
                id="resolution-note"
                className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder={tTutor('detail.resolutionNotePlaceholder')}
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
                  {tTutor(statusActionKey[status] ?? 'markResolved')}
                </Button>
              ))}
            </div>
            {updateStatus.isError && <p className="text-sm text-destructive">{tTutor('detail.updateFailed')}</p>}
            <SectionHeader
              title={tTutor('detail.replyTitle')}
              description={tTutor('detail.replyDescription')}
            />
            <TeacherReplyComposer
              isSubmitting={addNote.isPending}
              onSubmit={(content, richContent, onSuccess) =>
                requestId && addNote.mutate({ requestId, content, richContent }, { onSuccess })
              }
            />
            <TutorRequestTimeline notes={requestQuery.data.notes ?? []} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
