import { useTranslation } from 'react-i18next'
import { SegmentedFilter } from '@/components/base'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export type TutorRequestFilter = TeacherHelpStatus | 'all'

const filterValues: readonly TutorRequestFilter[] = ['all', 'pending', 'assigned', 'in_progress', 'resolved']

/* Canvas rule: filters are one segmented control, never a row of buttons. */
export function TutorRequestFilters({
  value,
  onChange,
}: {
  value: TutorRequestFilter
  onChange: (value: TutorRequestFilter) => void
}) {
  const { t } = useTranslation('tutor')
  const options = filterValues.map((option) => ({
    value: option,
    label: option === 'all' ? t('requests.all') : t(`common:status.teacherHelp.${option}`),
  }))

  return (
    // Five segments do not fit every phone in every language: the track scrolls.
    <div className="-mx-1 max-w-full overflow-x-auto px-1">
      <SegmentedFilter className="w-max" options={options} value={value} onChange={onChange} label={t('requests.filterLabel')} />
    </div>
  )
}
