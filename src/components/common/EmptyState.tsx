import type { ReactNode } from 'react'

type EmptyStateProps = {
  title?: string
  description?: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ title, description, message, action }: EmptyStateProps) {
  const body = description ?? message

  return (
    <div className="mx-auto max-w-xl text-center">
      {title && <p className="text-base font-semibold text-foreground">{title}</p>}
      {body && (
        <p className={`${title ? 'mt-2 ' : ''}text-sm leading-6 text-muted-foreground`}>
          {body}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
