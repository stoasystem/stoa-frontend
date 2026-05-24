import { Button } from '@/components/ui/button'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

export type TutorRequestFilter = TeacherHelpStatus | 'all'

const filterOptions: { label: string; value: TutorRequestFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
]

export function TutorRequestFilters({
  value,
  onChange,
}: {
  value: TutorRequestFilter
  onChange: (value: TutorRequestFilter) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {filterOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
