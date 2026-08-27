import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  QuestionBankDifficulty,
  QuestionBankFilters as QuestionBankFiltersValue,
  QuestionBankLevel,
  QuestionBankQuestionType,
  QuestionSetStatus,
} from '@/types/questionBank'

type FilterOption<T extends string> = {
  value: T
  label: string
}

const levelOptions: FilterOption<QuestionBankLevel | 'all'>[] = [
  { value: 'all', label: 'All levels' },
  { value: 'lower-secondary', label: 'Lower Secondary' },
  { value: 'upper-secondary', label: 'Upper Secondary' },
  { value: 'exam-prep', label: 'Exam Prep' },
]

const difficultyOptions: FilterOption<QuestionBankDifficulty | 'all'>[] = [
  { value: 'all', label: 'All difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

const typeOptions: FilterOption<QuestionBankQuestionType | 'all'>[] = [
  { value: 'all', label: 'All types' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'short_answer', label: 'Short answer' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'step_by_step', label: 'Step by step' },
]

const statusOptions: FilterOption<QuestionSetStatus | 'all'>[] = [
  { value: 'all', label: 'All status' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'review_recommended', label: 'Review' },
]

export function QuestionBankFilters({
  value,
  onChange,
  showLevel = true,
  showDifficulty = true,
  showQuestionType = false,
  showStatus = false,
}: {
  value: QuestionBankFiltersValue
  onChange: (filters: QuestionBankFiltersValue) => void
  showLevel?: boolean
  showDifficulty?: boolean
  showQuestionType?: boolean
  showStatus?: boolean
}) {
  const { t } = useTranslation('practice')
  const activeCount = [value.level, value.difficulty, value.questionType, value.status].filter(
    (filter) => filter && filter !== 'all',
  ).length

  function patchFilter(next: QuestionBankFiltersValue) {
    onChange({ ...value, ...next })
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card/80 p-4 shadow-[var(--platform-shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="brand-section-kicker">Filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Narrow the library without leaving this page.</p>
        </div>
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ level: 'all', difficulty: 'all', questionType: 'all', status: 'all' })}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {showLevel && (
          <FilterGroup
            label="Grade / Level"
            value={value.level ?? 'all'}
            options={levelOptions}
            onChange={(level) => patchFilter({ level })}
          />
        )}
        {showDifficulty && (
          <FilterGroup
            label="Difficulty"
            value={value.difficulty ?? 'all'}
            options={difficultyOptions}
            onChange={(difficulty) => patchFilter({ difficulty })}
          />
        )}
        {showQuestionType && (
          <FilterGroup
            label={t('ui.questionType')}
            value={value.questionType ?? 'all'}
            options={typeOptions}
            onChange={(questionType) => patchFilter({ questionType })}
          />
        )}
        {showStatus && (
          <FilterGroup
            label="Status"
            value={value.status ?? 'all'}
            options={statusOptions}
            onChange={(status) => patchFilter({ status })}
          />
        )}
      </div>
    </div>
  )
}

function FilterGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-md border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === option.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/80 bg-[hsl(var(--platform-surface-app))] text-muted-foreground hover:border-primary/35 hover:text-foreground',
            )}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
