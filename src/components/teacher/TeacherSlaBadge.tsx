import { AlertTriangle, CheckCircle2, Clock3, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const detail = typeof sla?.requestToFirstActionMinutes === 'number'
    ? t('slaBadge.elapsed', { minutes: sla.requestToFirstActionMinutes, target: sla.targetMinutes })
    : t('slaBadge.target', { target: sla?.targetMinutes ?? 30 })

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{t(`slaBadge.status.${status}`)}</span>
      <span className="text-[11px] opacity-80">{detail}</span>
    </span>
  )
}
