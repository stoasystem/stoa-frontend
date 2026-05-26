import { useMutation } from '@tanstack/react-query'
import { getPracticeHint } from '@/services/practice/practiceApi'
import type { PracticeHintRequest } from '@/types/practice'

export function usePracticeHintMutation() {
  return useMutation({
    mutationFn: (payload: PracticeHintRequest) => getPracticeHint(payload),
  })
}
