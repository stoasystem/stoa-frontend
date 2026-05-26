import { cn } from '@/lib/utils'

export function MultipleChoiceChallenge({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: string[]
  selected: string
  onSelect: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map((option) => (
        <button
          aria-checked={selected === option}
          className={cn(
            'min-h-14 rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            selected === option
              ? 'border-primary bg-[hsl(var(--stoa-brand-burgundy-soft))] text-foreground'
              : 'border-border bg-card hover:border-primary/40',
          )}
          disabled={disabled}
          key={option}
          onClick={() => onSelect(option)}
          role="radio"
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  )
}
