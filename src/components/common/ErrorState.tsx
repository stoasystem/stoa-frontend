import type { ReactNode } from 'react'

type ErrorStateProps = {
  title?: string
  message: string
  action?: ReactNode
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-xl text-center">
      {title && <p className="text-base font-semibold text-foreground">{title}</p>}
      <p className={`${title ? 'mt-2 ' : ''}text-sm leading-6 text-destructive`}>
        {message}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
