import type { LucideIcon } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ICON, ICON_BUTTON_SIZES } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Components board: "Icon buttons: no border, a label for assistive tech, a
 * tooltip on hover." Sizes board: box / glyph 24/14 ... 36/22.
 *
 * plain: the bell in the bar (secondary glyph, no fill).
 * tinted: the + in a composer.  filled: send.  gray: close.
 */
export type IconButtonVariant = 'plain' | 'tinted' | 'filled' | 'gray'
export type IconButtonSize = keyof typeof ICON_BUTTON_SIZES

const variantClasses: Record<IconButtonVariant, string> = {
  plain: 'bg-transparent text-caption hover:bg-fill',
  tinted: 'bg-accent-tint text-accent hover:bg-[color-mix(in_srgb,var(--accent-tint),black_8%)]',
  filled: 'bg-accent text-on-accent hover:bg-accent-pressed',
  gray: 'bg-fill text-caption hover:bg-[color-mix(in_srgb,var(--fill),black_8%)]',
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** What the button does, read out and shown as the tooltip. Required. */
  label: string
  icon: LucideIcon
  size?: IconButtonSize
  /** The board pairs some boxes with a smaller glyph (send: 32 / 18). */
  glyph?: number
  variant?: IconButtonVariant
  /** Drawn over the glyph, e.g. an unread dot. */
  badge?: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, size = 36, glyph, variant = 'plain', badge, className, style, type, ...props },
  ref,
) {
  const glyphSize = glyph ?? ICON_BUTTON_SIZES[size]

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      data-variant={variant}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border-0 p-0',
        'transition-[background-color,opacity] duration-[var(--motion-press)] ease-out',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <Icon aria-hidden="true" data-glyph size={glyphSize} strokeWidth={ICON.stroke} />
      {badge}
    </button>
  )
})
