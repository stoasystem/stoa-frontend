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
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium">{request.studentName}</h2>
                <p className="text-sm text-muted-foreground">
                  {request.subject} - {request.grade}
                </p>
              </div>
              <HelpRequestStatusBadge status={request.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
