type ErrorStateProps = {
  title?: string
  message: string
}

export function ErrorState({ title, message }: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-xl text-center">
      {title && <p className="text-base font-semibold text-foreground">{title}</p>}
      <p className={`${title ? 'mt-2 ' : ''}text-sm leading-6 text-destructive`}>
        {message}
      </p>
    </div>
  )
}
