import { useQuery } from '@tanstack/react-query'
import { getDueReview, getReviewSummary } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

/**
 * The questions that have come back round, for one knowledge point or for all.
 *
 * With a `unitId` the server selects before it cuts a page, so a point with
 * one card due is not hidden behind a fuller one and the count on its star
 * is the count of what opens (stoa-backend#70).
 */
export function useDueReviewQuery(
  { enabled = true, unitId }: { enabled?: boolean; unitId?: string } = {},
) {
  return useQuery({
    queryKey: practiceQueryKeys.reviewDue(unitId),
    queryFn: () => getDueReview(unitId),
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
