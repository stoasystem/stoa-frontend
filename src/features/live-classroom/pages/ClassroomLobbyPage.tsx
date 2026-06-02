import { useEffect } from 'react'
import { UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackButton } from '@/components/common/BackButton'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DeviceCheckPanel } from '@/features/live-classroom/components/DeviceCheckPanel'
import { SessionContextPanel } from '@/features/live-classroom/components/SessionContextPanel'
import { useJoinClassroomLobby, useJoinClassroomRoom } from '@/features/live-classroom/hooks/useClassroomActions'
import { useClassroomRoomState } from '@/features/live-classroom/hooks/useClassroomRoomState'
import { useClassroomSession } from '@/features/live-classroom/hooks/useClassroomSession'
import { formatClassroomTimeRange } from '@/features/live-classroom/utils/formatClassroom'

export function ClassroomLobbyPage({ tutorMode = false }: { tutorMode?: boolean }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const sessionQuery = useClassroomSession(sessionId)
  const joinLobbyMutation = useJoinClassroomLobby(sessionId)
  const joinRoomMutation = useJoinClassroomRoom(sessionId)
  const roomState = useClassroomRoomState()
  const session = sessionQuery.data

  useEffect(() => {
    if (!sessionId) return
    joinLobbyMutation.mutate()
    // Mutate once per loaded lobby route.
  }, [sessionId])

  function handleJoin() {
    joinRoomMutation.mutate(undefined, {
      onSuccess: () => {
        navigate(tutorMode
          ? `/tutor/classroom/sessions/${sessionId}/room`
          : `/classroom/sessions/${sessionId}/room`)
      },
    })
  }

  return (
    <DashboardLayout>
      <PageContainer className="space-y-6 p-0">
        <PageHeader
          eyebrow={tutorMode ? 'Tutor classroom' : 'Classroom Lobby'}
          title={tutorMode ? 'Prepare for Classroom' : 'Classroom Lobby'}
          description={session ? `${session.title} · ${formatClassroomTimeRange(session)}` : 'Prepare before entering the classroom.'}
          actions={<BackButton label="Back" to={tutorMode ? '/tutor/classroom' : '/classroom'} />}
        />

        {sessionQuery.isLoading && <EmptyState message="Loading classroom lobby..." />}
        {sessionQuery.isError && <ErrorState message="We could not open this classroom lobby." />}

        {session && (
          <section className="rounded-lg border bg-card shadow-[var(--platform-shadow-card)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] p-2 text-primary">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="brand-section-kicker">Tutor</p>
                    <h2 className="mt-2 text-xl font-semibold">{session.tutorName ?? 'Tutor to be confirmed'}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{session.tutorTitle ?? 'STOA tutor'}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {tutorMode
                        ? `Student: ${session.studentName}. Review the learning context before joining.`
                        : 'Review the question, material, and goal before entering the live workspace.'}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
                  <DeviceCheckPanel
                    deviceState={roomState.deviceState}
                    onToggleCamera={roomState.toggleCamera}
                    onToggleMicrophone={roomState.toggleMicrophone}
                  />
                  <SessionContextPanel session={session} />
                </div>
              </div>

              <aside className="border-t bg-[hsl(var(--platform-surface-app))] p-5 lg:border-l lg:border-t-0">
                <p className="brand-section-kicker">Status</p>
                <h2 className="mt-2 text-xl font-semibold">
                  {session.lobbyState === 'waiting_for_tutor'
                    ? 'Waiting for tutor'
                    : session.lobbyState === 'completed'
                      ? 'Classroom ended'
                      : 'Ready to join'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {session.lobbyState === 'waiting_for_tutor'
                    ? 'Review the attached question while the tutor joins.'
                    : session.lobbyState === 'completed'
                      ? 'This classroom has ended. Review the summary.'
                      : 'Enter when your camera, microphone, and context are ready.'}
                </p>
                <div className="mt-5 grid gap-2">
                  {session.lobbyState === 'completed' ? (
                    <Button asChild>
                      <Link to={`/classroom/sessions/${session.id}/summary`}>View Summary</Link>
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleJoin} disabled={joinRoomMutation.isPending}>
                      {joinRoomMutation.isPending ? 'Joining...' : 'Join Classroom'}
                    </Button>
                  )}
                </div>
              </aside>
            </div>
          </section>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
