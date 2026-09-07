import type { TFunction } from 'i18next'
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

// The labels were literal English here, so the filter chips stayed English on a
// translated page. They are built per render from the active language instead.
function levelOptions(t: TFunction<'practice'>): FilterOption<QuestionBankLevel | 'all'>[] {
  return [
    { value: 'all', label: t('filters.allLevels') },
    { value: 'lower-secondary', label: t('filters.levelLowerSecondary') },
    { value: 'upper-secondary', label: t('filters.levelUpperSecondary') },
    { value: 'exam-prep', label: t('filters.levelExamPrep') },
  ]
}

function difficultyOptions(
  t: TFunction<'practice'>,
): FilterOption<QuestionBankDifficulty | 'all'>[] {
  return [
    { value: 'all', label: t('filters.allDifficulty') },
    { value: 'easy', label: t('filters.easy') },
    { value: 'medium', label: t('filters.medium') },
    { value: 'hard', label: t('filters.hard') },
  ]
}

function typeOptions(
  t: TFunction<'practice'>,
): FilterOption<QuestionBankQuestionType | 'all'>[] {
  return [
    { value: 'all', label: t('filters.allTypes') },
    { value: 'multiple_choice', label: t('questionType.multiple_choice') },
    { value: 'short_answer', label: t('questionType.short_answer') },
    { value: 'numeric', label: t('questionType.numeric') },
    { value: 'step_by_step', label: t('questionType.step_by_step') },
  ]
}

function statusOptions(t: TFunction<'practice'>): FilterOption<QuestionSetStatus | 'all'>[] {
  return [
    { value: 'all', label: t('filters.allStatus') },
    { value: 'not_started', label: t('set.status.not_started') },
    { value: 'in_progress', label: t('set.status.in_progress') },
    { value: 'completed', label: t('set.status.completed') },
    { value: 'review_recommended', label: t('filters.statusReview') },
  ]
}

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
          <p className="brand-section-kicker">{t('filters.title')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('filters.subtitle')}</p>
        </div>
        {activeCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ level: 'all', difficulty: 'all', questionType: 'all', status: 'all' })}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {t('filters.clear')}
          </Button>
        )}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {showLevel && (
          <FilterGroup
            label={t('filters.levelLabel')}
            value={value.level ?? 'all'}
            options={levelOptions(t)}
            onChange={(level) => patchFilter({ level })}
          />
        )}
        {showDifficulty && (
          <FilterGroup
            label={t('filters.difficultyLabel')}
            value={value.difficulty ?? 'all'}
            options={difficultyOptions(t)}
            onChange={(difficulty) => patchFilter({ difficulty })}
          />
        )}
        {showQuestionType && (
          <FilterGroup
            label={t('ui.questionType')}
            value={value.questionType ?? 'all'}
            options={typeOptions(t)}
            onChange={(questionType) => patchFilter({ questionType })}
          />
        )}
        {showStatus && (
          <FilterGroup
            label={t('filters.statusLabel')}
            value={value.status ?? 'all'}
            options={statusOptions(t)}
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
