import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { HelpRequestAttachments } from '@/components/teacher/HelpRequestAttachments'
import { HelpRequestStatusBadge } from '@/components/teacher/HelpRequestStatusBadge'
import { ModerationReportDialog } from '@/components/moderation/ModerationReportDialog'
import { TeacherSlaBadge } from '@/components/teacher/TeacherSlaBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getSubjectLabel } from '@/lib/displayLabels'
import type { TeacherHelpMessage, TeacherHelpRequestDetail } from '@/types/teacher'
import { isOpenHelpRequest } from '@/types/teacherHelp'

export function HelpRequestDetailCard({ request }: { request: TeacherHelpRequestDetail }) {
  const { t, i18n } = useTranslation('teacher')
  const firstAction = request.firstTeacherActionAt
    ? t('requests.firstAction', {
        time: new Date(request.firstTeacherActionAt).toLocaleString(formattingLocale(i18n.resolvedLanguage), {
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
            {/* The subject arrives as its id (`mathematics`); the rest of the
              * app calls it Mathematik. Same row wording as the request list. */}
            <p className="mt-1 text-sm text-muted-foreground">
              {t('requests.row', {
                subject: getSubjectLabel(request.subject, t),
                grade: request.student.grade,
              })}
            </p>
            {/* The request list leaves this out of its rows; it lives here. */}
            <p className="mt-1 text-xs text-muted-foreground" data-first-action>
              {firstAction}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* A finished request has no target left to miss; as on its row in
              * the list, the badge only shows while it is open (#162). */}
            {isOpenHelpRequest(request.status) && <TeacherSlaBadge sla={request.sla} />}
            <HelpRequestStatusBadge status={request.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.requestMessage && (
          <div className="rounded-md bg-secondary p-3">
            <p className="text-xs uppercase text-muted-foreground">{t('detail.requestSummary')}</p>
            {/* The message itself is the student's own words: served, not translated. */}
            <p className="mt-2 text-sm leading-6">{request.requestMessage}</p>
          </div>
        )}
        {conversationMessages(request).map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'student'
                ? 'rounded-md border border-primary/30 bg-primary/5 p-3'
                : 'rounded-md border p-3'
            }
          >
            <p className="text-xs uppercase text-muted-foreground">
              {t(`detail.roles.${message.role}`, { defaultValue: message.role })}
            </p>
            {/* Served by the backend, in whatever language it wrote it. */}
            <p className="mt-2 text-sm leading-6">{message.content}</p>
            <HelpRequestAttachments requestId={request.requestId} attachments={message.attachments} />
            {(message.role === 'student' || message.role === 'assistant') && (
              <div className="mt-2 border-t pt-2">
                <ModerationReportDialog
                  questionId={request.requestId}
                  surface={message.role === 'assistant' ? 'ai_answer' : 'question'}
                  triggerLabel={t(
                    message.role === 'student' ? 'detail.reportStudentContent' : 'detail.reportContent',
                  )}
                  contextLabel={t('detail.reportContext')}
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

/**
 * The conversation without the teacher replies the timeline already shows.
 * The server writes each reply twice, as a note and as a teacher message in
 * the student's conversation (same text, same time), and returns both; the
 * note keeps the formatting, so the message copy is the one left out (#271).
 */
function conversationMessages(request: TeacherHelpRequestDetail): TeacherHelpMessage[] {
  const noted = new Set((request.notes ?? []).map((note) => replyKey(note.createdAt, note.note)))
  return request.messages.filter(
    (message) => message.role !== 'teacher' || !noted.has(replyKey(message.createdAt, message.content)),
  )
}

function replyKey(createdAt: string, text: string) {
  return `${createdAt}\u0000${text}`
}
