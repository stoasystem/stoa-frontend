import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { HelpRequestAttachments } from '@/components/teacher/HelpRequestAttachments'
import { Button } from '@/components/ui/button'
import { formattingLocale } from '@/i18n/languages'
import type { TeacherHelpRequestDetail, TeacherPrepQuestion } from '@/types/teacher'

type Props = {
  request: TeacherHelpRequestDetail
  /** Opens the conversation on that message. */
  onShowMessage: (messageId: string) => void
}

/*
 * What a teacher reads before taking a request (#704): the student's first
 * question, their last one before asking for help, everything they sent, and
 * the stars the AI's answers named. No model writes any of it: the backend
 * picks each row from the conversation (stoa-backend#517), and the page shows
 * them as they come, never picking its own out of `messages`. The questions
 * are the student's own words, untranslated.
 */
export function TeacherPrepTable({ request, onShowMessage }: Props) {
  const { t } = useTranslation('teacher')
  const first = request.firstQuestion ?? null
  // `null` when it is the first question: then that is the one row.
  const last = first ? request.lastQuestion ?? null : null
  const uploads = request.uploads ?? []
  const stars = request.askedStars ?? []

  return (
    <section data-prep-table aria-labelledby="prep-table-title" className="rounded-md border border-border/70 p-3 sm:p-4">
      <h3 id="prep-table-title" className="m-0 text-sm font-semibold text-foreground">
        {t('prep.title')}
      </h3>
      <dl className="m-0 mt-2 divide-y divide-border/70">
        <PrepRow row="first" label={t(last ? 'prep.firstQuestion' : 'prep.question')}>
          {first ? (
            <PrepQuestion question={first} onShow={onShowMessage} />
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t('prep.noQuestion')}</p>
          )}
        </PrepRow>
        {last && (
          <PrepRow row="last" label={t('prep.lastQuestion')}>
            <PrepQuestion question={last} onShow={onShowMessage} />
          </PrepRow>
        )}
        <PrepRow row="uploads" label={t('prep.uploads')}>
          {uploads.length > 0 ? (
            <HelpRequestAttachments requestId={request.requestId} attachments={uploads} />
          ) : (
            <p className="m-0 text-sm text-muted-foreground">{t('prep.noUploads')}</p>
          )}
        </PrepRow>
        {/* Only stars the star map has; none, and the row is left out. */}
        {stars.length > 0 && (
          <PrepRow row="stars" label={t('prep.stars')}>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {stars.map((star) => (
                <li
                  key={star.unitId}
                  data-star-id={star.unitId}
                  className="rounded-full border px-2.5 py-0.5 text-sm text-foreground"
                >
                  {star.title}
                </li>
              ))}
            </ul>
          </PrepRow>
        )}
      </dl>
    </section>
  )
}

function PrepRow({ row, label, children }: { row: string; label: string; children: ReactNode }) {
  return (
    <div data-prep-row={row} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0">{children}</dd>
    </div>
  )
}

function PrepQuestion({ question, onShow }: { question: TeacherPrepQuestion; onShow: (messageId: string) => void }) {
  const { t, i18n } = useTranslation('teacher')
  const attachments = question.attachments?.length ?? 0
  const time = formatTime(question.createdAt, i18n.resolvedLanguage)
  return (
    <div>
      {question.content.trim() ? (
        <p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{question.content}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {time && <time dateTime={question.createdAt}>{time}</time>}
        {/* Its pictures are under Uploads, drawn once. */}
        {attachments > 0 && <span>{t('prep.attachmentCount', { count: attachments })}</span>}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          data-show-message={question.messageId}
          onClick={() => onShow(question.messageId)}
        >
          {t('prep.showInConversation')}
        </Button>
      </div>
    </div>
  )
}

function formatTime(value: string, language?: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(formattingLocale(language), { dateStyle: 'short', timeStyle: 'short' })
}
