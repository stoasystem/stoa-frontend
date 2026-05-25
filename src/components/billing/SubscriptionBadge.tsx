import { Badge } from '@/components/ui/badge'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import type { SubscriptionStatus } from '@/types/user'

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge variant={status === 'active' ? 'default' : 'secondary'}><SafeStatusLabel kind="subscription" value={status} /></Badge>
}
