import { Link } from 'react-router-dom'
import { HelpRequestStatusBadge } from '@/components/tutor/HelpRequestStatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import type { TutorHelpRequestSummary } from '@/types/tutor'

export function HelpRequestList({ requests }: { requests: TutorHelpRequestSummary[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No teacher help requests are available.</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Link key={request.requestId} to={`/tutor/requests/${request.requestId}`}>
          <Card className="transition-colors hover:bg-secondary/40">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{request.studentName}</h2>
                  {request.priority && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                      {request.priority} priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {request.subject} - {request.grade}
                </p>
                {request.requestMessage && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {request.requestMessage}
                  </p>
                )}
                <time className="mt-2 block text-xs text-muted-foreground">
                  {new Date(request.createdAt).toLocaleString()}
                </time>
              </div>
              <HelpRequestStatusBadge status={request.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
