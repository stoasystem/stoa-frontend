import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TeacherHelpRequest, TeacherHelpStatus } from '@/types/teacherHelp'

const statusCopy: Record<TeacherHelpStatus | 'idle' | 'failed', string> = {
  idle: 'Request human tutor support when the AI explanation is not clear enough.',
  pending: 'Waiting for a teacher to review this conversation.',
  assigned: 'A teacher has been assigned to this conversation.',
  in_progress: 'A teacher is helping with this conversation.',
  resolved: 'This teacher-help request has been resolved.',
  cancelled: 'This teacher-help request was cancelled.',
  failed: 'Teacher help could not be requested.',
}

function getStatusTitle(status: TeacherHelpStatus | 'idle' | 'failed') {
  if (status === 'idle') return 'Need help from a teacher?'
  if (status === 'pending') return 'Request pending'
  if (status === 'assigned') return 'Teacher assigned'
  if (status === 'in_progress') return 'Teacher is helping'
  if (status === 'resolved') return 'Help resolved'
  if (status === 'cancelled') return 'Request cancelled'
  return 'Request failed'
}

export function TeacherHelpStatusCard({
  request,
  isRequesting = false,
  error,
  onRequestTeacher,
}: {
  request?: TeacherHelpRequest | null
  isRequesting?: boolean
  error?: string | null
  onRequestTeacher?: () => void
}) {
  const status = error ? 'failed' : request?.status ?? 'idle'

  return (
    <div className="px-4 md:px-6">
      <Card className="mx-auto mb-4 max-w-3xl">
        <CardContent className="flex flex-col gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{getStatusTitle(status)}</div>
              <p className="mt-1 text-muted-foreground">
                {request?.teacherName && status !== 'resolved'
                  ? `${statusCopy[status]} Teacher: ${request.teacherName}.`
                  : statusCopy[status]}
              </p>
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            </div>
          </div>
          {(status === 'idle' || status === 'failed') && (
            <Button
              className="shrink-0"
              variant="outline"
              size="sm"
              onClick={onRequestTeacher}
              disabled={isRequesting || !onRequestTeacher}
            >
              {isRequesting ? 'Requesting...' : status === 'failed' ? 'Retry request' : 'Request teacher'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
