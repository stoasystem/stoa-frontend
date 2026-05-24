import { useParams } from 'react-router-dom'
import { HelpRequestDetailCard } from '@/components/tutor/HelpRequestDetailCard'
import { Button } from '@/components/ui/button'
import { useTutorHelpRequestDetailQuery } from '@/hooks/tutor/useTutorHelpRequestDetailQuery'
import { useUpdateTutorHelpRequestMutation } from '@/hooks/tutor/useUpdateTutorHelpRequestMutation'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

const statuses: TeacherHelpStatus[] = ['pending', 'assigned', 'in_progress', 'resolved']

export function TutorHelpRequestDetailPage() {
  const { requestId } = useParams()
  const requestQuery = useTutorHelpRequestDetailQuery(requestId)
  const updateStatus = useUpdateTutorHelpRequestMutation()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {requestQuery.isLoading && <p className="text-sm text-muted-foreground">Loading request...</p>}
        {requestQuery.isError && <p className="text-sm text-destructive">Failed to load request.</p>}
        {requestQuery.data && (
          <>
            <HelpRequestDetailCard request={requestQuery.data} />
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  disabled={updateStatus.isPending || !requestId}
                  onClick={() => requestId && updateStatus.mutate({ requestId, status })}
                >
                  Mark {status}
                </Button>
              ))}
            </div>
            {updateStatus.isError && <p className="text-sm text-destructive">Failed to update status.</p>}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
