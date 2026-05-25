import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { PageContainer } from '@/components/common/PageContainer'
import { PageActions } from '@/components/common/PageActions'
import { PageHeader } from '@/components/common/PageHeader'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import { SectionHeader } from '@/components/common/SectionHeader'
import { HelpRequestDetailCard } from '@/components/tutor/HelpRequestDetailCard'
import { TutorDashboardSkeleton } from '@/components/tutor/TutorDashboardSkeleton'
import { TutorRequestNoteForm } from '@/components/tutor/TutorRequestNoteForm'
import { TutorRequestTimeline } from '@/components/tutor/TutorRequestTimeline'
import { Button } from '@/components/ui/button'
import { useAddTutorHelpRequestNoteMutation } from '@/hooks/tutor/useAddTutorHelpRequestNoteMutation'
import { useTutorHelpRequestDetailQuery } from '@/hooks/tutor/useTutorHelpRequestDetailQuery'
import { useUpdateTutorHelpRequestMutation } from '@/hooks/tutor/useUpdateTutorHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

const statuses: TeacherHelpStatus[] = ['in_progress', 'resolved']

export function TutorHelpRequestDetailPage() {
  const { requestId } = useParams()
  const [resolutionNote, setResolutionNote] = useState('')
  const requestQuery = useTutorHelpRequestDetailQuery(requestId)
  const updateStatus = useUpdateTutorHelpRequestMutation()
  const addNote = useAddTutorHelpRequestNoteMutation()

  useEffect(() => {
    if (!requestId) return
    trackEvent('tutor_request_opened', { requestId })
  }, [requestId])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          title="Help Request"
          description="Review the student's context and record the tutor follow-up."
          actions={<PageActions secondary={<BackButton label="Requests" to="/tutor" />} />}
        />
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: 'Tutor', to: '/tutor' },
            { label: 'Requests', to: '/tutor' },
            { label: requestQuery.data?.student.name ?? 'Request detail' },
          ]}
        />
        {requestQuery.isLoading && <TutorDashboardSkeleton showHeader={false} />}
        {requestQuery.isError && <p className="text-sm text-destructive">Failed to load request.</p>}
        {requestQuery.data && (
          <div className="space-y-6">
            <HelpRequestDetailCard request={requestQuery.data} />
            <div className="rounded-lg border p-4">
              <label className="text-sm font-medium" htmlFor="resolution-note">
                Resolution note
              </label>
              <textarea
                id="resolution-note"
                className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={resolutionNote}
                onChange={(event) => setResolutionNote(event.target.value)}
                placeholder="Required before marking resolved."
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
                  Mark <SafeStatusLabel kind="teacherHelp" value={status} />
                </Button>
              ))}
            </div>
            {updateStatus.isError && <p className="text-sm text-destructive">Failed to update status.</p>}
            <SectionHeader
              title="Tutor notes"
              description="Record the intervention, next step, or follow-up the student needs."
            />
            <TutorRequestNoteForm
              isSubmitting={addNote.isPending}
              onSubmit={(content) => requestId && addNote.mutate({ requestId, content })}
            />
            <TutorRequestTimeline notes={requestQuery.data.notes ?? []} />
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
