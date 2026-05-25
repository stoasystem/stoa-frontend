import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BillingUsage } from '@/types/billing'

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = Math.min(100, Math.round((used / limit) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function PlanUsageCard({ usage }: { usage: BillingUsage }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage quota</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <UsageRow label="Learning messages" used={usage.aiMessagesUsed} limit={usage.aiMessagesLimit} />
        <UsageRow label="File uploads" used={usage.fileUploadsUsed} limit={usage.fileUploadsLimit} />
        <UsageRow label="Teacher help" used={usage.teacherHelpUsed} limit={usage.teacherHelpLimit} />
        <p className="text-xs text-muted-foreground">
          Current period: {new Date(usage.periodStart).toLocaleDateString()} -{' '}
          {new Date(usage.periodEnd).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
