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
              <header className="rounded-lg border bg-card px-4 py-3 shadow-[var(--platform-shadow-card)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="brand-section-kicker">{tutorMode ? 'Tutor classroom' : 'Online Classroom'}</p>
                    <h1 className="mt-1 truncate text-xl font-semibold sm:text-2xl">{session.title}</h1>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
                      {formatClassroomTimeRange(session)}
                    </span>
                    <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
                      Tutor: {session.tutorName ?? 'Tutor'}
                    </span>
                    {session.context?.sourceLabel && (
                      <span className="rounded-md border bg-[hsl(var(--platform-surface-app))] px-3 py-2">
                        {session.context.sourceLabel}
                      </span>
                    )}
                  </div>
                </div>
              </header>

              <main className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-4">
                  <ClassroomLearningWorkspace
                    session={session}
                    tutorMode={tutorMode}
                    whiteboardOpen={roomState.whiteboardOpen}
                  />
                  <ClassroomSidePanel
                    session={session}
                    activePanel={roomState.activePanel}
                    onPanelChange={roomState.setActivePanel}
                    tutorMode={tutorMode}
                  />
                </div>
                <div className="xl:sticky xl:top-24 xl:self-start">
                  <ClassroomVideoGrid participants={session.participants} />
                </div>
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
