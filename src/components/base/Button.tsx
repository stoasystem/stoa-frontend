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

/*
 * The pressable solid (#125).
 *
 * The signature of the design is not the corner radius, it is the 4 px hard
 * edge under a button: `0 var(--press-depth) 0 <edge>`, no blur. Pressed, the
 * button moves down by exactly that depth and the edge goes, so it is the
 * same shape, thinner -- a thing being pushed in rather than a rectangle that
 * changed colour. Only the two solid variants get it; a plain button is text
 * and has no side to show.
 *
 * None of these carries `motion-safe:`. Under `prefers-reduced-motion` the
 * displacement stays and only the tween between the two positions goes
 * (`motion-reduce:transition-none` below): the movement is the receipt for a
 * direct manipulation, and a button that does not move when pressed reads as
 * one that did not take the press.
 */
const LIFT_EDGE: Partial<Record<ButtonVariant, string>> = {
  filled: 'shadow-[0_var(--press-depth)_0_var(--accent-pressed)]',
  onSky: 'shadow-[0_var(--press-depth)_0_var(--on-sky-button-edge)]',
}

const SINK = 'active:translate-y-[var(--press-sink)] active:shadow-none'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Render the child (a router `Link`, an `<a>`) with the button's look. */
  asChild?: boolean
  /** Stretch to the container: the docked phone primary. */
  fullWidth?: boolean
  /**
   * Give the button its solid edge, and the canvas's 48 px floor with it.
   *
   * Opt-in rather than the default because this one component also draws the
   * sign-in form, the Ask panel and the account pages, and #125 is the
   * student's own screens: the star map, the chapter and the practice stage.
   * Turning it on everywhere is this prop becoming the default.
   */
  lift?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', size = 'regular', asChild = false, fullWidth = false, lift = false, className, style, type, ...props },
  ref,
) {
  const spec = BUTTON_SIZES[size]
  const plain = variant === 'plain' || variant === 'onSkyPlain'
  const dimensions: CSSProperties = {
    height: spec.height,
    // The board's height is what the button is; the floor is what it may not
    // go under, so a lifted `large` stays 50 and a lifted `regular` grows.
    minHeight: lift ? 'var(--control-h-roomy)' : undefined,
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
      data-lift={lift || undefined}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-0 font-semibold leading-none whitespace-nowrap no-underline',
        'transition-[background-color,opacity,transform,box-shadow] duration-[var(--motion-press)] ease-out',
        // Reduced motion keeps the press but loses the tween to it: the
        // button is simply already down. Nothing else here moves.
        'motion-reduce:transition-none',
        'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40',
        variantClasses[variant],
        lift && LIFT_EDGE[variant],
        lift && LIFT_EDGE[variant] && SINK,
        fullWidth && 'w-full',
        className,
      )}
      style={dimensions}
      {...props}
    />
  )
})
