import { useTranslation } from 'react-i18next'
import { HelpRequestStatusBadge } from '@/components/teacher/HelpRequestStatusBadge'
import { ModerationReportDialog } from '@/components/moderation/ModerationReportDialog'
import { TeacherSlaBadge } from '@/components/teacher/TeacherSlaBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TeacherHelpRequestDetail } from '@/types/teacher'

export function HelpRequestDetailCard({ request }: { request: TeacherHelpRequestDetail }) {
  const { t, i18n } = useTranslation('teacher')
  const firstAction = request.firstTeacherActionAt
    ? t('requests.firstAction', {
        time: new Date(request.firstTeacherActionAt).toLocaleString(i18n.resolvedLanguage, {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      })
    : t('requests.firstActionNone')

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{request.student.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.subject} - {request.student.grade}
            </p>
            {/* The request list leaves this out of its rows; it lives here. */}
            <p className="mt-1 text-xs text-muted-foreground" data-first-action>
              {firstAction}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TeacherSlaBadge sla={request.sla} />
            <HelpRequestStatusBadge status={request.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.requestMessage && (
          <div className="rounded-md bg-secondary p-3">
            <p className="text-xs uppercase text-muted-foreground">{t('detail.card.requestSummary')}</p>
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
              {t(`detail.card.roles.${message.role}`, { defaultValue: message.role })}
            </p>
            <p className="mt-2 text-sm leading-6">{message.content}</p>
            {(message.role === 'student' || message.role === 'assistant' || message.role === 'teacher') && (
              <div className="mt-2 border-t pt-2">
                <ModerationReportDialog
                  questionId={request.requestId}
                  surface={
                    message.role === 'assistant'
                      ? 'ai_answer'
                      : message.role === 'teacher'
                        ? 'teacher_reply'
                        : 'question'
                  }
                  triggerLabel={message.role === 'student' ? t('detail.card.reportStudent') : t('detail.card.report')}
                  contextLabel={t('detail.card.reportContext')}
                  defaultReason={message.role === 'assistant' ? 'incorrect_answer' : 'other'}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
