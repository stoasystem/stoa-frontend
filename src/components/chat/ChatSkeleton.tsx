import { Skeleton } from '@/components/common/Skeleton'
import { cn } from '@/lib/utils'

type ChatSkeletonProps = {
  compact?: boolean
}

export function ChatSkeleton({ compact = false }: ChatSkeletonProps) {
  return (
    <div
      className={cn(
        'chat-workspace flex overflow-hidden text-foreground',
        compact ? 'h-full min-h-0' : 'h-screen',
      )}
      role="status"
      aria-label="Loading chat"
    >
      {!compact && (
        <aside className="chat-panel hidden w-80 shrink-0 border-r p-4 md:block">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </aside>
      )}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="chat-panel border-b px-4 py-4 md:px-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <div className="flex-1 space-y-5 overflow-hidden px-4 py-6 md:px-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={index % 2 === 0 ? 'mr-auto max-w-2xl' : 'ml-auto max-w-xl'}>
              <Skeleton className="h-20 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="chat-panel border-t px-4 py-4 md:px-6">
          <Skeleton className="mx-auto h-24 max-w-3xl rounded-lg" />
        </div>
      </main>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
