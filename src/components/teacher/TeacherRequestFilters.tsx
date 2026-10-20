import { useTranslation } from 'react-i18next'
import { SegmentedFilter } from '@/components/base'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export type TeacherRequestFilter = TeacherHelpStatus | 'all'

// No "assigned": the teacher list carries the stored status, which is never
// "assigned" (only the student's view derives it), so that filter was always
// empty (#333).
const filterValues: readonly TeacherRequestFilter[] = ['all', 'pending', 'in_progress', 'resolved']

/* Canvas rule: filters are one segmented control, never a row of buttons. */
export function TeacherRequestFilters({
  value,
  onChange,
}: {
  value: TeacherRequestFilter
  onChange: (value: TeacherRequestFilter) => void
}) {
  const { t } = useTranslation('teacher')
  const options = filterValues.map((option) => ({
    value: option,
    label: option === 'all' ? t('requests.all') : t(`common:status.teacherHelp.${option}`),
  }))

  return (
    // Four segments do not fit every phone in every language: the track scrolls.
    // The scroller clips on both axes, so it keeps room for the focus ring
    // (2 + 2 px) on every side and gives it back with a negative margin.
    <div className="-m-1 max-w-full overflow-x-auto p-1">
      <SegmentedFilter className="w-max" options={options} value={value} onChange={onChange} label={t('requests.filterLabel')} />
    </div>
  )
}
