import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { TutorAssignmentBoard as TutorAssignmentBoardData } from '@/types/tutorAssignment'

export function TutorAssignmentBoard({ board }: { board: TutorAssignmentBoardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pending requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {board.pendingRequests.map((request) => {
            const suggestion = board.suggestions.find((item) => item.requestId === request.requestId)
            const tutor = board.availableTutors.find((item) => item.tutorId === suggestion?.tutorId)

            return (
              <div key={request.requestId} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">{request.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.grade} · {request.subject} · {request.priority}
                    </p>
                    {suggestion && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Suggested: {tutor?.name ?? suggestion.tutorId} — {suggestion.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info('Manual assignment is a Phase 12 frontend placeholder.')}
                  >
                    Assign
                  </Button>
                  {suggestion && (
                    <Button
                      size="sm"
                      onClick={() => {
                        trackEvent('tutor_assignment_suggested_clicked', {
                          requestId: request.requestId,
                          tutorId: suggestion.tutorId,
                        })
                        toast.info('Suggested assignment is a frontend placeholder.')
                      }}
                    >
                      Use suggestion
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
      <AvailableTutorList board={board} />
    </div>
  )
}

function AvailableTutorList({ board }: { board: TutorAssignmentBoardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Available tutors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {board.availableTutors.map((tutor) => (
          <div key={tutor.tutorId} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{tutor.name}</p>
                <p className="text-sm text-muted-foreground">{tutor.subjects.join(', ')}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                load {tutor.currentLoad}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {tutor.isAvailableNow ? 'Available now' : 'Next slot later'}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
