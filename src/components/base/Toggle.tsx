import type { ButtonHTMLAttributes } from 'react'
import { TOGGLE } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Needed unless `aria-labelledby` points at the row title. */
  label?: string
}

/*
 * Sizes board: toggle 26 x 44, radius 13, knob 22. On: accent track, knob at
 * the end. Off: --toggle-track-off, which keeps 3:1 against the row and the
 * knob (the canvas draws no off state; --fill would be 1.22:1). A real switch,
 * so a screen reader says "on" or "off" and Space flips it.
 *
 * Only on --surface, --ground, --sidebar or --accent-tint, the backgrounds the
 * contrast gate rates the off track against. Not on --fill (2.97:1) and not
 * inside data-surface="sky" (the on track is 1.45:1 there); add a pair to
 * scripts/contrast-pairs.json before putting it anywhere else.
 */
export function Toggle({ checked, onCheckedChange, label, className, style, disabled, ...props }: ToggleProps) {
  const inset = (TOGGLE.height - TOGGLE.knob) / 2

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center border-0 p-0',
        'transition-colors duration-[var(--motion-press)] ease-out disabled:pointer-events-none disabled:opacity-40',
        checked ? 'bg-accent' : 'bg-[var(--toggle-track-off)]',
        className,
      )}
      style={{ width: TOGGLE.width, height: TOGGLE.height, borderRadius: TOGGLE.radius, ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        data-knob
        className="absolute rounded-full bg-surface shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-[left] duration-[var(--motion-press)] ease-out"
        style={{
          width: TOGGLE.knob,
          height: TOGGLE.knob,
          top: inset,
          left: checked ? TOGGLE.width - TOGGLE.knob - inset : inset,
        }}
      />
    </button>
  )
}
