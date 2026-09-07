import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/common/Skeleton'

type PageSkeletonProps = {
  rows?: number
}

export function PageSkeleton({ rows = 3 }: PageSkeletonProps) {
  const { t } = useTranslation('common')

  return (
    <div className="space-y-6" role="status" aria-label={t('a11y.loadingPage')}>
      <div className="space-y-3">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">{t('status.loading')}</span>
    </div>
  )
}
