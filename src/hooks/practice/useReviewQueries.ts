import { useQuery } from '@tanstack/react-query'
import { getDueReview, getReviewSummary } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function useDueReviewQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: practiceQueryKeys.reviewDue(),
    queryFn: getDueReview,
    enabled,
  })
}

export function useReviewSummaryQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: practiceQueryKeys.reviewSummary(),
    queryFn: getReviewSummary,
    enabled,
  })
}
