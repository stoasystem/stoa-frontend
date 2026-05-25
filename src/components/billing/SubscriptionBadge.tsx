import { Badge } from '@/components/ui/badge'
import type { SubscriptionStatus } from '@/types/user'

const labels: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
}

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge variant={status === 'active' ? 'default' : 'secondary'}>{labels[status]}</Badge>
}
