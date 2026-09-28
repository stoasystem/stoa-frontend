import { PROGRESS } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Sizes board: progress 4 high, radius 4, the track is the fill colour and the
 * bar the accent (Components, "Grouped list": 96 wide in a row).
 */
export function Progress({
  value,
  max = 100,
  label,
  className,
  width,
}: {
  value: number
  max?: number
  /** What is being measured, for assistive tech. */
  label: string
  className?: string
  width?: number | string
}) {
  const clamped = Math.min(Math.max(value, 0), max)
  const percent = max > 0 ? (clamped / max) * 100 : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={cn('shrink-0 overflow-hidden bg-fill', className)}
      style={{ height: PROGRESS.height, borderRadius: PROGRESS.radius, width }}
    >
      <div className="h-full bg-accent" style={{ width: `${percent}%`, borderRadius: PROGRESS.radius }} />
    </div>
  )
}
