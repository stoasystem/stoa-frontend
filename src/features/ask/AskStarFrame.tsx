import type { HTMLAttributes, ReactNode } from 'react'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import type { LearningState } from '@/features/starmap/model/starMap'
import { cn } from '@/lib/utils'

/** The way to a star from Ask, in the thread's own link style. */
export const ASK_STAR_LINK_CLASS =
  'text-[13px] font-semibold text-accent hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/*
 * A star in the Ask thread: the lit card (#51) and the star an answer found
 * (#487) share it. A card of its own, with the star on a piece of the night
 * sky beside what is said about it.
 */
export function AskStarFrame({
  state,
  progress,
  className,
  children,
  ...rest
}: {
  state: LearningState
  progress?: number
  children: ReactNode
} & HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...rest}
      className={cn('flex w-full items-center gap-3 border border-solid border-[color:var(--card-border)] bg-surface', className)}
      style={{ padding: '12px 14px', borderRadius: 16 }}
    >
      {/* A piece of the night sky: the star's tokens live there. */}
      <span data-surface="sky" aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-[12px]" style={{ background: 'var(--sky)' }}>
        <StarGlyph state={state} progress={progress} size={34} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
    </section>
  )
}
