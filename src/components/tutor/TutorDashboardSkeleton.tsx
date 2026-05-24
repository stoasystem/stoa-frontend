import { Skeleton } from '@/components/common/Skeleton'
import { Card, CardContent } from '@/components/ui/card'

type TutorDashboardSkeletonProps = {
  showHeader?: boolean
}

export function TutorDashboardSkeleton({ showHeader = true }: TutorDashboardSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading tutor dashboard">
      {showHeader && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
