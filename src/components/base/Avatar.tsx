import type { CSSProperties } from 'react'
import { AVATAR_SIZES } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

export type AvatarSize = keyof typeof AVATAR_SIZES
/** navy tint by default (the signed-in person); neutral and green in lists. */
export type AvatarTone = 'accent' | 'neutral' | 'green'

const toneClasses: Record<AvatarTone, string> = {
  accent: 'bg-accent-tint text-accent',
  neutral: 'bg-fill text-pill-neutral',
  green: 'bg-green-tint text-green',
}

/** Up to two initials from a display name: "Lina Meier" -> "LM". */
export function initialsOf(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = [...words[0]][0] ?? ''
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : ''
  return (first + last).toLocaleUpperCase()
}

export interface AvatarProps {
  name: string | null | undefined
  size?: AvatarSize
  tone?: AvatarTone
  className?: string
  style?: CSSProperties
}

/*
 * Sizes board, "Avatars": 16 ... 60, initials only. Decorative: whatever it
 * sits in (a row, the account button) carries the person's name.
 */
export function Avatar({ name, size = 30, tone = 'accent', className, style }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      data-avatar
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-[0.2px]',
        toneClasses[tone],
        className,
      )}
      style={{ width: size, height: size, fontSize: AVATAR_SIZES[size], lineHeight: 1, ...style }}
    >
      {initialsOf(name)}
    </span>
  )
}
