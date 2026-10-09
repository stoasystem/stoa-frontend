import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { trackEvent } from '@/services/analytics/analyticsClient'
import type { TeacherAssignmentBoard as TeacherAssignmentBoardData } from '@/types/teacherAssignment'

export function TeacherAssignmentBoard({ board }: { board: TeacherAssignmentBoardData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Pending requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {board.pendingRequests.map((request) => {
            const suggestion = board.suggestions.find((item) => item.requestId === request.requestId)
            const teacher = board.availableTeachers.find((item) => item.teacherId === suggestion?.teacherId)

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
                        Suggested: {teacher?.name ?? suggestion.teacherId} — {suggestion.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.info('Manual assignment is not available yet.')}
                  >
                    Assign
                  </Button>
                  {suggestion && (
                    <Button
                      size="sm"
                      onClick={() => {
                        trackEvent('teacher_assignment_suggested_clicked', {
                          requestId: request.requestId,
                          teacherId: suggestion.teacherId,
                        })
                        toast.info('Suggested assignment is not available yet.')
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
      <AvailableTeacherList board={board} />
    </div>
  )
}

function AvailableTeacherList({ board }: { board: TeacherAssignmentBoardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Available teachers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {board.availableTeachers.map((teacher) => (
          <div key={teacher.teacherId} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{teacher.name}</p>
                <p className="text-sm text-muted-foreground">{teacher.subjects.join(', ')}</p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                load {teacher.currentLoad}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {teacher.isAvailableNow ? 'Available now' : 'Next slot later'}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
