import type { ReactNode } from 'react'
import { PILL } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Components board, "Status": tinted pills for state, a dot for presence, text
 * for the rest. No borders, no icons inside pills.
 *   accent  Pending          gold     Assigned, waiting
 *   green   In progress, Ready   neutral  Resolved
 */
export type PillTone = 'accent' | 'gold' | 'green' | 'neutral'

const toneClasses: Record<PillTone, string> = {
  accent: 'bg-accent-tint text-accent',
  gold: 'bg-gold-tint text-gold',
  green: 'bg-green-tint text-green',
  neutral: 'bg-fill text-pill-neutral',
}

export function Pill({ tone = 'accent', children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <span
      data-tone={tone}
      className={cn('inline-flex shrink-0 items-center whitespace-nowrap', toneClasses[tone], className)}
      style={{
        height: PILL.height,
        borderRadius: PILL.radius,
        paddingInline: PILL.paddingX,
        fontSize: PILL.fontSize,
        fontWeight: PILL.fontWeight,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  )
}

/** Presence: an 8 px green dot (Motion and states, "Online / ready"). */
export function PresenceDot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full bg-green', className)} />
}
