import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/*
 * The button, on the Alpenklar shape (step 3).
 *
 * Two things were wrong before this. It still spoke in the old brand tokens
 * (`--stoa-brand-burgundy-soft`, `--primary`) rather than the ones the design
 * actually uses, and more than half the variants and sizes the application
 * asks for did not exist here at all: `onSky`, `onSkyPlain`, `plain`,
 * `tinted`, `gray`, and the sizes `large`, `wide`, `small`, `regular` — 73
 * call sites between them. `cva` ignores a value it does not know without
 * complaining, so every one of those silently rendered as the default.
 *
 * A filled button sits on a solid edge and sinks onto it when pressed, which
 * is what makes it feel like a button rather than a coloured rectangle. The
 * depth is one token; only the colour under it changes with the surface.
 */
const press = 'active:translate-y-[var(--press-sink)] active:shadow-none'

const buttonVariants = cva(
  [
    'stoa-type-button inline-flex min-w-0 items-center justify-center gap-2',
    'min-h-[var(--control-h)]',
    'whitespace-normal rounded-[var(--r-control)] text-center font-bold leading-tight',
    'transition-[transform,box-shadow,background-color] duration-[var(--press-time)]',
    // No focus ring here: there is one in the base layer and #83 decided there
    // may only be one. A ring utility on this component is a second.
    'disabled:pointer-events-none disabled:opacity-50 sm:whitespace-nowrap',
  ].join(' '),
  {
    variants: {
      variant: {
        /** The one filled button on a light screen. */
        default: [
          'bg-[color:var(--accent)] text-[color:var(--on-accent)]',
          'shadow-[0_var(--press-depth)_0_var(--accent-pressed)]',
          'hover:bg-[color:var(--accent-pressed)]',
          press,
        ].join(' '),
        /** The filled button on the sky, where the accent has to be lifted to be read. */
        onSky: [
          'bg-[color:var(--accent-on-sky)] text-[color:var(--on-accent-on-sky)]',
          'shadow-[0_var(--press-depth)_0_rgba(0,0,0,0.45)]',
          'hover:brightness-110',
          press,
        ].join(' '),
        /** Text only, the accent colour: the quiet action beside a filled one. */
        plain: 'text-[color:var(--accent)] hover:bg-[color:var(--accent-tint)]',
        onSkyPlain: 'text-[color:var(--on-sky-plain)] hover:bg-[color:var(--on-sky-selected)]',
        /** Accent on its own tint: emphasis without a second filled button. */
        tinted: 'bg-[color:var(--accent-tint)] text-[color:var(--accent)] hover:brightness-95',
        gray: 'bg-[color:var(--fill)] text-[color:var(--ink)] hover:brightness-95',
        outline: [
          'border-2 border-[color:var(--separator)] bg-[color:var(--surface)] text-[color:var(--ink)]',
          'hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]',
        ].join(' '),
        secondary: 'bg-[color:var(--fill)] text-[color:var(--ink)] hover:brightness-95',
        ghost: 'text-[color:var(--ink)] hover:bg-[color:var(--fill)]',
        link: 'text-[color:var(--accent)] underline-offset-4 hover:underline',
        destructive: [
          'bg-[color:var(--red)] text-white',
          'shadow-[0_var(--press-depth)_0_rgba(0,0,0,0.3)]',
          press,
        ].join(' '),
      },
      size: {
        /** Every size is a token; nothing here is a literal. */
        default: 'px-[var(--control-px)] py-[var(--control-py)] text-[length:var(--control-text)]',
        regular: 'px-[var(--control-px)] py-[var(--control-py)] text-[length:var(--control-text)]',
        sm: 'px-[var(--control-px-small)] py-[var(--control-py)] text-[length:var(--control-text-small)]',
        small: 'px-[var(--control-px-small)] py-[var(--control-py)] text-[length:var(--control-text-small)]',
        lg: 'min-h-[var(--control-h-large)] px-[var(--control-px-large)] py-[var(--control-py-large)] text-[length:var(--control-text-large)]',
        large: 'min-h-[var(--control-h-large)] px-[var(--control-px-large)] py-[var(--control-py-large)] text-[length:var(--control-text-large)]',
        wide: 'min-h-[var(--control-h-large)] w-full px-[var(--control-px-large)] py-[var(--control-py-large)] text-[length:var(--control-text-large)]',
        icon: 'size-[var(--control-h)] shrink-0 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    // The default variant is a filled button: marked so the one-filled-button-
    // per-screen rule (Components board) can count it next to base `Button`.
    const filled = (variant ?? 'default') === 'default' || variant === 'onSky'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        data-emphasis={filled ? 'filled' : undefined}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { buttonVariants }
