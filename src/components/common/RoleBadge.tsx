import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/user'

export function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useTranslation('common')

  return <Badge variant="outline">{t(`roles.${role}`)}</Badge>
}
