import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/user'

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant="outline">{role}</Badge>
}
