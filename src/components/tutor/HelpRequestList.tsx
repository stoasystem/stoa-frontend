import { useTranslation } from 'react-i18next'
import { Group, Pill, Row, type PillTone } from '@/components/base'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type { TutorHelpRequestSummary } from '@/types/tutor'

/*
 * Teacher board, Requests: one grouped list, a row per request (avatar 36,
 * the student, "subject · grade -- the question", then when it came in and
 * its status as a tinted pill, and the chevron into the request). The
 * response-time target shows only when it is at risk or missed. Where the
 * request came from and the first action are on the request itself.
 */
const statusTones: Record<TeacherHelpStatus, PillTone> = {
  pending: 'accent',
  assigned: 'gold',
  in_progress: 'green',
  resolved: 'neutral',
  cancelled: 'neutral',
}

export function HelpRequestList({ requests }: { requests: TutorHelpRequestSummary[] }) {
  const { t, i18n } = useTranslation('tutor')

  if (requests.length === 0) {
    return <p className="m-0 text-[15px] text-caption">{t('requests.empty')}</p>
  }

  const opened = (iso: string) =>
    new Date(iso).toLocaleString(i18n.resolvedLanguage, { dateStyle: 'short', timeStyle: 'short' })

  return (
    <Group>
      {requests.map((request) => {
        const where = t('requests.row', { subject: request.subject, grade: request.grade })
        const sla = request.sla?.status
        return (
          <Row
            key={request.requestId}
            to={`/tutor/requests/${request.requestId}`}
            leading={{ kind: 'avatar', name: request.studentName }}
            title={request.studentName}
            subtitle={request.requestMessage ? `${where} — ${request.requestMessage}` : where}
            trailing={
              <>
                <time dateTime={request.createdAt} className="hidden text-[13px] sm:inline">
                  {opened(request.createdAt)}
                </time>
                {request.priority === 'high' && (
                  <Pill tone="gold" className="hidden sm:inline-flex">
                    {t('requests.priority', { priority: t('common:status.priority.high') })}
                  </Pill>
                )}
                {(sla === 'at_risk' || sla === 'breached') && <Pill tone="gold">{t(`requests.sla.${sla}`)}</Pill>}
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
