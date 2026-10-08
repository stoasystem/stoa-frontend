import type { ReactNode } from 'react'
import { Murmi, type MurmiMood } from '@/components/brand/Murmi'

type EmptyStateProps = {
  title?: string
  description?: string
  message?: string
  action?: ReactNode
  /** What Murmi is doing while there is nothing here. Omit for the usual quiet. */
  mood?: MurmiMood
}

/**
 * Nothing here yet.
 *
 * It was two lines of grey text. A page with nothing on it is the place a
 * product feels least finished, so the marmot stands in for the thing that is
 * missing — and says nothing the text does not already say.
 */
export function EmptyState({ title, description, message, action, mood = 'calm' }: EmptyStateProps) {
  const body = description ?? message

  return (
    <div
      className="mx-auto flex flex-col items-center text-center"
      style={{ gap: 'var(--state-gap)', maxWidth: 'var(--state-measure)' }}
    >
      <Murmi mood={mood} size="var(--murmi-state)" />
      <div>
        {title && <p className="m-0 text-base font-semibold text-foreground">{title}</p>}
        {body && (
          <p className={`${title ? 'mt-2 ' : 'm-0 '}text-sm leading-6 text-muted-foreground`}>{body}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
