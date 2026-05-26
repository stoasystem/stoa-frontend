import { ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OrderingChallenge({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: string[]
  selected: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}) {
  function move(option: string) {
    if (disabled) return
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option))
      return
    }
    onChange([...selected, option])
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Available steps</p>
        {options.map((option) => (
          <Button
            className="h-auto min-h-11 w-full justify-start whitespace-normal text-left"
            disabled={disabled}
            key={option}
            onClick={() => move(option)}
            type="button"
            variant={selected.includes(option) ? 'secondary' : 'outline'}
          >
            <ArrowDownUp className="h-4 w-4 shrink-0" aria-hidden="true" />
            {option}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Selected order</p>
        <ol className="min-h-36 space-y-2 rounded-lg border border-dashed p-3 text-sm">
          {selected.length === 0 && <li className="text-muted-foreground">Choose steps in order.</li>}
          {selected.map((option, index) => (
            <li className="rounded-md bg-muted/60 px-3 py-2" key={option}>
              {index + 1}. {option}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
