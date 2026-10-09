import { Badge } from '@/components/ui/badge'
import { SafeStatusLabel } from '@/components/common/SafeStatusLabel'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export function HelpRequestStatusBadge({ status }: { status: TeacherHelpStatus }) {
  const variant =
    status === 'resolved' ? 'secondary' : status === 'cancelled' ? 'destructive' : 'outline'
  return <Badge variant={variant}><SafeStatusLabel kind="teacherHelp" value={status} /></Badge>
}
