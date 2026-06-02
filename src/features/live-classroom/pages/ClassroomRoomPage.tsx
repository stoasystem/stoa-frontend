import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ClassroomControlBar } from '@/features/live-classroom/components/ClassroomControlBar'
import { ClassroomLearningWorkspace } from '@/features/live-classroom/components/ClassroomLearningWorkspace'
import { ClassroomLeaveDialog } from '@/features/live-classroom/components/ClassroomLeaveDialog'
import { ClassroomSidePanel } from '@/features/live-classroom/components/ClassroomSidePanel'
import { ClassroomVideoGrid } from '@/features/live-classroom/components/ClassroomVideoGrid'
import { useCompleteClassroomSession, useLeaveClassroomRoom } from '@/features/live-classroom/hooks/useClassroomActions'
import { useClassroomRoomState } from '@/features/live-classroom/hooks/useClassroomRoomState'
import { useClassroomSession } from '@/features/live-classroom/hooks/useClassroomSession'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function ClassroomRoomPage({ tutorMode = false }: { tutorMode?: boolean }) {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const sessionQuery = useClassroomSession(sessionId)
  const leaveMutation = useLeaveClassroomRoom(sessionId)
  const completeMutation = useCompleteClassroomSession(sessionId)
  const initialPanel = location.search.includes('source=chat') ? 'chat' : tutorMode ? 'notes' : 'materials'
  const roomState = useClassroomRoomState(initialPanel)
  const session = sessionQuery.data

  function confirmLeave() {
    if (tutorMode) {
      completeMutation.mutate(undefined, {
        onSuccess: () => navigate(`/tutor/classroom/sessions/${sessionId}/summary`),
      })
      return
    }

    leaveMutation.mutate(undefined, {
      onSuccess: () => navigate(`/classroom/sessions/${sessionId}/summary`),
    })
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[hsl(var(--platform-surface-app))]">
        <PageContainer className="space-y-4 p-0">
          {sessionQuery.isLoading && <EmptyState message="Connecting to classroom..." />}
          {sessionQuery.isError && <ErrorState message="We could not open this classroom." />}

          {session && (
            <>
              <header className="rounded-lg border bg-card p-4 shadow-[var(--platform-shadow-card)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="brand-section-kicker">{tutorMode ? 'Tutor classroom' : 'Online Classroom'}</p>
                    <h1 className="mt-1 text-2xl font-semibold">{session.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatClassroomTimeRange(session)} · Tutor: {session.tutorName ?? 'Tutor'}
                    </p>
                  </div>
                  {session.context?.sourceLabel && (
                    <div className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2 text-sm">
                      Source: {session.context.sourceLabel}
                    </div>
                  )}
                </div>
              </header>

              <main className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-4">
                  <ClassroomVideoGrid participants={session.participants} />
                  <ClassroomLearningWorkspace
                    session={session}
                    tutorMode={tutorMode}
                    whiteboardOpen={roomState.whiteboardOpen}
                  />
                </div>
                <ClassroomSidePanel
                  session={session}
                  activePanel={roomState.activePanel}
                  onPanelChange={roomState.setActivePanel}
                  tutorMode={tutorMode}
                />
              </main>
            </>
          )}
        </PageContainer>

        {session && (
          <ClassroomControlBar
            deviceState={roomState.deviceState}
            tutorMode={tutorMode}
            onToggleMicrophone={roomState.toggleMicrophone}
            onToggleCamera={roomState.toggleCamera}
            onToggleWhiteboard={roomState.toggleWhiteboard}
            onPanelChange={roomState.setActivePanel}
            onLeave={() => roomState.setLeaveDialogOpen(true)}
          />
        )}
        <ClassroomLeaveDialog
          open={roomState.leaveDialogOpen}
          tutorMode={tutorMode}
          onOpenChange={roomState.setLeaveDialogOpen}
          onConfirm={confirmLeave}
        />
      </div>
    </DashboardLayout>
  )
}
