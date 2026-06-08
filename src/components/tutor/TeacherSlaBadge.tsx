import { AlertTriangle, CheckCircle2, Clock3, HelpCircle } from 'lucide-react'
import type { TeacherSlaSnapshot } from '@/types/tutor'

const statusConfig = {
  within_target: {
    label: 'Within SLA',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Icon: CheckCircle2,
  },
  at_risk: {
    label: 'At Risk',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    Icon: Clock3,
  },
  breached: {
    label: 'Breached',
    className: 'border-red-200 bg-red-50 text-red-800',
    Icon: AlertTriangle,
  },
  unknown: {
    label: 'Unknown SLA',
    className: 'border-border bg-secondary text-secondary-foreground',
    Icon: HelpCircle,
  },
}

export function TeacherSlaBadge({ sla }: { sla?: TeacherSlaSnapshot }) {
  const config = statusConfig[sla?.status ?? 'unknown']
  const Icon = config.Icon
  const detail = typeof sla?.requestToFirstActionMinutes === 'number'
    ? `${sla.requestToFirstActionMinutes}m / ${sla.targetMinutes}m`
    : `${sla?.targetMinutes ?? 30}m target`

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{config.label}</span>
      <span className="text-[11px] opacity-80">{detail}</span>
    </span>
  )
}
