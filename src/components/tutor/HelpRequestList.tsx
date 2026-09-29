import { useTranslation } from 'react-i18next'
import { Group, Pill, Row, type PillTone } from '@/components/base'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type { TutorHelpRequestSummary } from '@/types/tutor'

/*
 * Teacher board, Requests: one grouped list, a row per request (avatar 36,
 * the student, "subject · grade -- the question", then when it came in, its
 * priority and its status as tinted pills, and the chevron into the request).
 * On a phone the priority and a short time move to the front of the subtitle
 * so they stay on the row. The response-time target shows only when it is at
 * risk (gold) or missed (red). The first tutor action is on the request
 * itself (HelpRequestDetailCard).
 */
const statusTones: Record<TeacherHelpStatus, PillTone> = {
  pending: 'accent',
  assigned: 'gold',
  in_progress: 'green',
  resolved: 'neutral',
  cancelled: 'neutral',
}

const slaTones = { at_risk: 'gold', breached: 'danger' } as const satisfies Record<string, PillTone>

// The API's "medium" is the everyday level, which the shared labels call "normal".
const priorityLabelKeys = {
  low: 'common:status.priority.low',
  medium: 'common:status.priority.normal',
  high: 'common:status.priority.high',
} as const

export function HelpRequestList({ requests }: { requests: TutorHelpRequestSummary[] }) {
  const { t, i18n } = useTranslation('tutor')

  if (requests.length === 0) {
    return <p className="m-0 text-[15px] text-caption">{t('requests.empty')}</p>
  }

  const opened = (iso: string) =>
    new Date(iso).toLocaleString(i18n.resolvedLanguage, { dateStyle: 'short', timeStyle: 'short' })
  // A phone row has room for a few characters: today's requests show the time,
  // older ones the day.
  const openedShort = (iso: string) => {
    const date = new Date(iso)
    const today = date.toDateString() === new Date().toDateString()
    return date.toLocaleString(
      i18n.resolvedLanguage,
      today ? { timeStyle: 'short' } : { day: 'numeric', month: 'numeric' },
    )
  }

  return (
    <Group label={t('requests.listLabel')}>
      {requests.map((request) => {
        const where = t('requests.row', { subject: request.subject, grade: request.grade })
        const sla = request.sla?.status
        const priority = request.priority
          ? t('requests.priority', { priority: t(priorityLabelKeys[request.priority]) })
          : null
        return (
          <Row
            key={request.requestId}
            to={`/tutor/requests/${request.requestId}`}
            leading={{ kind: 'avatar', name: request.studentName }}
            title={request.studentName}
            // The question is what the teacher triages by: two lines of it,
            // as the old card gave it, not one cut after "subject · grade".
            subtitleLines={2}
            subtitle={
              <>
                <span data-phone-meta className="sm:hidden">
                  {request.priority && `${t(priorityLabelKeys[request.priority])} · `}
                  <time dateTime={request.createdAt} title={opened(request.createdAt)}>
                    {openedShort(request.createdAt)}
                  </time>
                  {' · '}
                </span>
                {request.requestMessage ? `${where} — ${request.requestMessage}` : where}
              </>
            }
            trailing={
              <>
                <time dateTime={request.createdAt} className="hidden text-[13px] sm:inline">
                  {opened(request.createdAt)}
                </time>
                {priority && (
                  <Pill tone={request.priority === 'high' ? 'gold' : 'neutral'} className="hidden sm:inline-flex">
                    {priority}
                  </Pill>
                )}
                {(sla === 'at_risk' || sla === 'breached') && <Pill tone={slaTones[sla]}>{t(`requests.sla.${sla}`)}</Pill>}
                <Pill tone={statusTones[request.status] ?? 'neutral'}>
                  <SafeStatusLabel kind="teacherHelp" value={request.status} />
                </Pill>
              </>
            }
          />
        )
      })}
    </Group>
  )
}
