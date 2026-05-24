import { Badge } from '@/components/ui/badge'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export function HelpRequestStatusBadge({ status }: { status: TeacherHelpStatus }) {
  const variant =
    status === 'resolved' ? 'secondary' : status === 'cancelled' ? 'destructive' : 'outline'
  return <Badge variant={variant}>{status}</Badge>
}
