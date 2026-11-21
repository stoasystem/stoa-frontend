import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formattingLocale } from '@/i18n/languages'
import { HelpRequestAttachments } from '@/components/teacher/HelpRequestAttachments'
import { HelpRequestStatusBadge } from '@/components/teacher/HelpRequestStatusBadge'
import { ModerationReportDialog } from '@/components/moderation/ModerationReportDialog'
import { TeacherPrepTable } from '@/components/teacher/TeacherPrepTable'
import { TeacherSlaBadge } from '@/components/teacher/TeacherSlaBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { getGradeLabelOrNotSet, getSubjectLabel } from '@/lib/displayLabels'
import type { TeacherHelpMessage, TeacherHelpRequestDetail } from '@/types/teacher'
import { helpModeOf, isOpenHelpRequest } from '@/types/teacherHelp'

export function HelpRequestDetailCard({ request }: { request: TeacherHelpRequestDetail }) {
  const { t, i18n } = useTranslation('teacher')
  // The whole conversation is folded: the preparation table above it is what
  // a teacher reads first, and leads to a message in it (#704).
  const [conversationOpen, setConversationOpen] = useState(false)
  const [shownMessage, setShownMessage] = useState<string | null>(null)
  const messages = conversationMessages(request)
  const showMessage = (messageId: string) => {
    setConversationOpen(true)
    setShownMessage(messageId)
  }
  useEffect(() => {
    if (!conversationOpen || !shownMessage) return
    const message = document.getElementById(messageAnchor(shownMessage))
    if (!message) return
    message.scrollIntoView?.({ block: 'center' })
    message.focus({ preventScroll: true })
  }, [conversationOpen, shownMessage])
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
                grade: getGradeLabelOrNotSet(request.student.grade, t),
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
            {/* How the student asked to be helped (#705); an older request is a text answer. */}
            <span
              data-help-mode={helpModeOf(request)}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-foreground"
            >
              {t(`helpMode.${helpModeOf(request)}`)}
            </span>
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
        <TeacherPrepTable request={request} onShowMessage={showMessage} />
        {messages.length > 0 && (
          <details
            data-conversation
            open={conversationOpen}
            onToggle={(event) => setConversationOpen(event.currentTarget.open)}
            className="rounded-md border border-border/70"
          >
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">
              {t('detail.conversation', { count: messages.length })}
            </summary>
            <div className="space-y-3 border-t border-border/70 p-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  id={messageAnchor(message.id)}
                  tabIndex={-1}
                  data-message-id={message.id}
                  data-shown-message={message.id === shownMessage ? true : undefined}
                  className={[
                    message.role === 'student'
                      ? 'rounded-md border border-primary/30 bg-primary/5 p-3'
                      : 'rounded-md border p-3',
                    message.id === shownMessage ? 'ring-2 ring-primary ring-offset-2' : '',
                  ].join(' ')}
                >
                  <p className="text-xs uppercase text-muted-foreground">
                    {t(`detail.roles.${message.role}`, { defaultValue: message.role })}
                  </p>
                  {/* Served by the backend, in whatever language it wrote it. The
                    * assistant's answer is Markdown with formulas, drawn as Ask
                    * draws it for the student, line breaks kept (#545). */}
                  {message.role === 'assistant' ? (
                    <p data-assistant-answer className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                      <MathRenderer>{message.content}</MathRenderer>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6">{message.content}</p>
                  )}
                  <HelpRequestAttachments
                    requestId={request.requestId}
                    attachments={message.attachments}
                    byTeacher={message.role === 'teacher'}
                  />
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
            </div>
          </details>
        )}
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

/** Where the preparation table finds a message in the conversation. */
function messageAnchor(messageId: string) {
  return `help-message-${messageId}`
}

function replyKey(createdAt: string, text: string) {
  return `${createdAt}\u0000${text}`
}
