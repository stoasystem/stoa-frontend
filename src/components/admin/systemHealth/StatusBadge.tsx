import { useTranslation } from 'react-i18next'
import { Pill, type PillTone } from '@/components/base'
import type { AlarmState, FeatureStatus } from '@/services/admin/systemHealthApi'

export const STATUS_TONE: Record<FeatureStatus, PillTone> = {
  ok: 'green',
  warn: 'gold',
  bad: 'danger',
  unknown: 'neutral',
}

const ALARM_TONE: Record<AlarmState, PillTone> = {
  ALARM: 'danger',
  OK: 'green',
  INSUFFICIENT_DATA: 'neutral',
}

export function StatusBadge({ status }: { status: FeatureStatus }) {
  const { t } = useTranslation('admin')
  const known = status in STATUS_TONE ? status : 'unknown'
  return (
    <Pill tone={STATUS_TONE[known]}>
      <span data-status={known}>{t(`systemHealth.status.${known}`)}</span>
    </Pill>
  )
}

export function AlarmStateBadge({ state }: { state: AlarmState }) {
  const { t } = useTranslation('admin')
  const known = state in ALARM_TONE ? state : 'INSUFFICIENT_DATA'
  return <Pill tone={ALARM_TONE[known]}>{t(`systemHealth.alarms.state.${known}`)}</Pill>
}
