export const invalidFieldClass = 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40'

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-xs leading-5 text-destructive" role="alert">
      {message}
    </p>
  )
}
