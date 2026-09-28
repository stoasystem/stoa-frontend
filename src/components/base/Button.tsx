import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { BUTTON_SIZES } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Components board, "Buttons": three weights. One filled button per screen,
 * tinted for the second choice, plain for everything else; gray where the
 * choice is neutral. On the sky the filled button is white, and the plain one
 * is white at 85% -- nothing red or navy sits on the sky.
 */
export type ButtonVariant = 'filled' | 'tinted' | 'plain' | 'gray' | 'onSky' | 'onSkyPlain'
export type ButtonSize = keyof typeof BUTTON_SIZES

// Motion and states: hover / press 120 ms ease-out. Filled: darker accent;
// tinted and gray: 8% darker; plain: 70% opacity. Disabled: 40%, no hover.
const variantClasses: Record<ButtonVariant, string> = {
  filled: 'bg-accent text-on-accent hover:bg-accent-pressed active:bg-accent-pressed',
  tinted:
    'bg-accent-tint text-accent hover:bg-[color-mix(in_srgb,var(--accent-tint),black_8%)] active:bg-[color-mix(in_srgb,var(--accent-tint),black_8%)]',
  plain: 'bg-transparent text-accent hover:opacity-70 active:opacity-70',
  gray: 'bg-fill text-ink hover:bg-[color-mix(in_srgb,var(--fill),black_8%)] active:bg-[color-mix(in_srgb,var(--fill),black_8%)]',
  onSky:
    'bg-[var(--on-sky-button)] text-[color:var(--on-sky-button-text)] hover:bg-[color-mix(in_srgb,var(--on-sky-button),black_8%)]',
  onSkyPlain: 'bg-transparent text-[color:var(--on-sky-plain)] hover:opacity-70 active:opacity-70',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render the child (a router `Link`, an `<a>`) with the button's look. */
  asChild?: boolean
  /** Stretch to the container: the docked phone primary. */
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', size = 'regular', asChild = false, fullWidth = false, className, style, type, ...props },
  ref,
) {
  const spec = BUTTON_SIZES[size]
  const plain = variant === 'plain' || variant === 'onSkyPlain'
  const dimensions: CSSProperties = {
    height: spec.height,
    // A plain button is text: the board draws it with no padding at all.
    paddingInline: plain ? 0 : spec.paddingX,
    borderRadius: spec.radius,
    fontSize: spec.fontSize,
    ...style,
  }
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      ref={ref}
      // A button without a type submits the form it sits in.
      type={asChild ? undefined : (type ?? 'button')}
      data-variant={variant}
      data-size={size}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-0 font-semibold leading-none whitespace-nowrap no-underline',
        'transition-[background-color,opacity] duration-[var(--motion-press)] ease-out',
        'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40',
        variantClasses[variant],
        fullWidth && 'w-full',
        className,
      )}
      style={dimensions}
      {...props}
    />
  )
})
