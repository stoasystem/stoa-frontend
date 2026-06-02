export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return <div className="text-sm text-muted-foreground" role="status">{message}</div>
}
