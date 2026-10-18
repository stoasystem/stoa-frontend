import { useTranslation } from 'react-i18next'
import { Stats } from '@/components/base'
import { formatMinutes } from '@/lib/displayLabels'
import type { TeacherStats } from '@/types/teacher'

const NO_VALUE = '—'

/* Teacher board: three figures under the title, not three cards. Figures it
 * does not have show as a dash and a failed read says so: a zero here is a
 * claim that nothing is waiting (#271). */
export function TeacherStatsCards({ stats, isError = false }: { stats?: TeacherStats; isError?: boolean }) {
  const { t } = useTranslation('teacher')

  return (
    <div className="flex flex-col gap-2">
      <Stats
        items={[
          { key: 'pending', value: stats?.pendingRequests ?? NO_VALUE, label: t('requests.pending') },
          { key: 'resolved', value: stats?.resolvedToday ?? NO_VALUE, label: t('requests.resolvedToday') },
          {
            key: 'response',
            value: stats ? formatMinutes(stats.averageResponseTimeMinutes, t) : NO_VALUE,
            label: t('requests.averageResponse'),
          },
        ]}
      />
      {isError && (
        <p role="status" className="text-sm text-red">
          {t('requests.statsLoadFailed')}
        </p>
      )}
    </div>
  )
}
