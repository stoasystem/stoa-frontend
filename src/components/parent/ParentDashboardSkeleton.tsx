import { Skeleton } from '@/components/common/Skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type ParentDashboardSkeletonProps = {
  showHeader?: boolean
}

export function ParentDashboardSkeleton({ showHeader = true }: ParentDashboardSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading parent dashboard">
      {showHeader && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
