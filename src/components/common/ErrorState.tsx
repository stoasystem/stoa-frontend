export function ErrorState({ message }: { message: string }) {
  return <div className="text-sm text-destructive">{message}</div>
}
