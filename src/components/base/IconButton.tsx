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
 *
 * The button is the hit area and the circle inside it is what is drawn, so a
 * phone can give a 36 control a 44 target (Sizes: "Touch targets never fall
 * under 44 on phone; the visible control may be smaller").
 */
export type IconButtonVariant = 'plain' | 'tinted' | 'filled' | 'gray'
export type IconButtonSize = keyof typeof ICON_BUTTON_SIZES

const variantClasses: Record<IconButtonVariant, string> = {
  plain: 'bg-transparent text-caption group-hover:bg-fill',
  tinted: 'bg-accent-tint text-accent group-hover:bg-[color-mix(in_srgb,var(--accent-tint),black_8%)]',
  filled: 'bg-accent text-on-accent group-hover:bg-accent-pressed',
  gray: 'bg-fill text-caption group-hover:bg-[color-mix(in_srgb,var(--fill),black_8%)]',
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** What the button does, read out and shown as the tooltip. Required. */
  label: string
  icon: LucideIcon
  size?: IconButtonSize
  /** The board pairs some boxes with a smaller glyph (send: 32 / 18). */
  glyph?: number
  /** A hit area larger than the drawn box, e.g. 44 on a phone. */
  hitSize?: number
  variant?: IconButtonVariant
  /** Drawn over the glyph, e.g. an unread dot. */
  badge?: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon: Icon, size = 36, glyph, hitSize, variant = 'plain', badge, className, style, type, ...props },
  ref,
) {
  const glyphSize = glyph ?? ICON_BUTTON_SIZES[size]
  const hit = Math.max(size, hitSize ?? size)

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      data-variant={variant}
      data-ring-on-face
      className={cn(
        'group relative inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      style={{ width: hit, height: hit, ...style }}
      {...props}
    >
      <span
        aria-hidden="true"
        data-icon-button-face
        className={cn(
          'relative inline-flex items-center justify-center rounded-full group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring',
          'transition-[background-color,opacity] duration-[var(--motion-press)] ease-out',
          variantClasses[variant],
        )}
        style={{ width: size, height: size }}
      >
        <Icon data-glyph size={glyphSize} strokeWidth={ICON.stroke} />
        {badge}
      </span>
    </button>
  )
})
