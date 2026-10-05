import { useTranslation } from 'react-i18next'
import { Stats } from '@/components/base'
import type { TutorStats } from '@/types/tutor'

const fallbackStats: TutorStats = {
  pendingRequests: 0,
  resolvedToday: 0,
  averageResponseTimeMinutes: 0,
}

/* Teacher board: three figures under the title, not three cards. */
export function TutorStatsCards({ stats = fallbackStats }: { stats?: TutorStats }) {
  const { t } = useTranslation('tutor')

  return (
    <Stats
      items={[
        { key: 'pending', value: stats.pendingRequests, label: t('requests.pending') },
        { key: 'resolved', value: stats.resolvedToday, label: t('requests.resolvedToday') },
        {
          key: 'response',
          value: t('requests.minutes', { count: stats.averageResponseTimeMinutes }),
          label: t('requests.averageResponse'),
        },
      ]}
    />
  )
}
