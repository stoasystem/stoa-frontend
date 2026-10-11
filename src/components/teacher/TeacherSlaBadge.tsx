import { AlertTriangle, CheckCircle2, Clock3, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatMinutes } from '@/lib/displayLabels'
import type { TeacherSlaSnapshot } from '@/types/teacher'

const statusConfig = {
  within_target: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Icon: CheckCircle2,
  },
  at_risk: {
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    Icon: Clock3,
  },
  breached: {
    className: 'border-red-200 bg-red-50 text-red-800',
    Icon: AlertTriangle,
  },
  unknown: {
    className: 'border-border bg-secondary text-secondary-foreground',
    Icon: HelpCircle,
  },
}

export function TeacherSlaBadge({ sla }: { sla?: TeacherSlaSnapshot }) {
  const { t } = useTranslation('teacher')
  const status = sla?.status ?? 'unknown'
  const config = statusConfig[status]
  const Icon = config.Icon
  // A request left for four days read "6576m / 30m". Nobody counts in
  // thousands of minutes: past an hour this says hours, past two days, days.
  const detail =
    typeof sla?.requestToFirstActionMinutes === 'number'
      ? t('requests.sla.elapsed', {
          elapsed: formatMinutes(sla.requestToFirstActionMinutes, t),
          target: formatMinutes(sla.targetMinutes, t),
        })
      : t('requests.sla.target', { target: formatMinutes(sla?.targetMinutes ?? 30, t) })

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{t(`requests.sla.${status}`)}</span>
      <span className="text-[11px] opacity-80">{detail}</span>
    </span>
  )
}
