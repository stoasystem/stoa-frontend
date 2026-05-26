import { useMutation } from '@tanstack/react-query'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import type { PracticeAnswerRequest } from '@/types/practice'

export function useSubmitChallengeAnswerMutation() {
  return useMutation({
    mutationFn: ({ challengeId, payload }: { challengeId: string; payload: PracticeAnswerRequest }) =>
      submitChallengeAnswer(challengeId, payload),
  })
}
