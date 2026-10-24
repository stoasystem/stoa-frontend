import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { KnowledgeMapResponse, PracticeAnswerRequest } from '@/types/practice'

/**
 * One answer in a lesson. A right one can light the knowledge point and any
 * answer reschedules review, so the sky and the review read again (#342) --
 * not the lesson itself, which is on screen.
 *
 * Of the sky, only the stars around the one being practised read again
 * (#503): the skeleton is marked stale and read when the map is back on
 * screen. A backend before stoa-backend#127 has no such stars and sends the
 * sky in full, which then reads again as before.
 */
export function useSubmitChallengeAnswerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ challengeId, payload }: { challengeId: string; payload: PracticeAnswerRequest }) =>
      submitChallengeAnswer(challengeId, payload),
    onSuccess: () => {
      const skeleton = queryClient.getQueryData<KnowledgeMapResponse>(practiceQueryKeys.knowledgeMap(''))?.view === 'skeleton'
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.knowledgeMapStarsAll() })
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.knowledgeMap(''), exact: true, refetchType: skeleton ? 'none' : 'active' })
      void queryClient.invalidateQueries({ queryKey: [...practiceQueryKeys.all, 'review-due'] })
      void queryClient.invalidateQueries({ queryKey: practiceQueryKeys.reviewSummary() })
    },
  })
}
