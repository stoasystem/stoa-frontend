import { Link } from 'react-router-dom'
import { HelpRequestStatusBadge } from '@/components/tutor/HelpRequestStatusBadge'
import { TeacherSlaBadge } from '@/components/tutor/TeacherSlaBadge'
import { Card, CardContent } from '@/components/ui/card'
import type { TutorHelpRequestSummary } from '@/types/tutor'

export function HelpRequestList({ requests }: { requests: TutorHelpRequestSummary[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No tutor support requests are available.</p>
  }

  return (
    <div className="min-w-0 space-y-3">
      {requests.map((request) => (
        <Link className="block min-w-0" key={request.requestId} to={`/tutor/requests/${request.requestId}`}>
          <Card className="min-w-0 transition-colors hover:bg-secondary/40">
            <CardContent className="grid min-w-0 gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 break-words font-medium">{request.studentName}</h2>
                  {request.priority && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {request.priority} priority
                    </span>
                  )}
                </div>
                <p className="break-words text-sm text-muted-foreground">
                  {request.subject} - {request.grade}
                </p>
                {request.requestMessage && (
                  <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
                    {request.requestMessage}
                  </p>
                )}
                <time className="mt-2 block text-xs text-muted-foreground">
                  Opened {new Date(request.createdAt).toLocaleString()}
                </time>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  Source: Learning Assistant conversation
                </p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  First tutor action:{' '}
                  {request.firstTutorActionAt
                    ? new Date(request.firstTutorActionAt).toLocaleString()
                    : 'not recorded'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <TeacherSlaBadge sla={request.sla} />
                <HelpRequestStatusBadge status={request.status} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
