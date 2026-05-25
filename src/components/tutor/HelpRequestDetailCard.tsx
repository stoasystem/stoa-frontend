import { HelpRequestStatusBadge } from '@/components/tutor/HelpRequestStatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TutorHelpRequestDetail } from '@/types/tutor'

export function HelpRequestDetailCard({ request }: { request: TutorHelpRequestDetail }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{request.student.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.subject} - {request.student.grade}
            </p>
          </div>
          <HelpRequestStatusBadge status={request.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.requestMessage && (
          <div className="rounded-md bg-secondary p-3">
            <p className="text-xs uppercase text-muted-foreground">Request summary</p>
            <p className="mt-2 text-sm leading-6">{request.requestMessage}</p>
          </div>
        )}
        {request.messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'student'
                ? 'rounded-md border border-primary/30 bg-primary/5 p-3'
                : 'rounded-md border p-3'
            }
          >
            <p className="text-xs uppercase text-muted-foreground">
              {message.role === 'assistant' ? 'AI answer' : message.role}
            </p>
            <p className="mt-2 text-sm leading-6">{message.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
