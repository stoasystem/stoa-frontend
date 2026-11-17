import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { VoiceInput } from '@/components/base/useVoiceRecording'
import { recordingTypeHere } from '@/lib/voiceRecording'
import { getMyVoiceQuestions, transcribeVoiceQuestion } from '@/services/student/voiceQuestionsApi'
import { useAuthStore } from '@/store/authStore'

/** Whether this student may ask by voice (`GET /students/me/voice-questions`). */
export const voiceQuestionsQueryKey = ['student', 'voice-questions'] as const

/**
 * The voice input for Ask's composers (#697), or `undefined` where the
 * microphone should only say how to dictate (#515): a student no linked
 * parent allowed (or with no linked parent), a browser that cannot record one
 * of the three formats the backend takes, or while the setting is unknown --
 * still loading or failed to load. Only a student is asked.
 */
export function useVoiceQuestionInput(): VoiceInput | undefined {
  const queryClient = useQueryClient()
  const student = useAuthStore((state) => state.user?.role === 'student')
  const [recordingType] = useState(() => recordingTypeHere())
  const setting = useQuery({
    queryKey: voiceQuestionsQueryKey,
    queryFn: getMyVoiceQuestions,
    enabled: student && recordingType !== null,
    staleTime: 60_000,
    retry: false,
  })
  const allowed = setting.data?.allowed === true

  return useMemo<VoiceInput | undefined>(() => {
    if (!allowed || !recordingType) return undefined
    return {
      recordingType,
      transcribe: transcribeVoiceQuestion,
      // A parent turned it off while the page was open: read the setting again.
      onNotAllowed: () => {
        queryClient.setQueryData(voiceQuestionsQueryKey, { allowed: false })
        void queryClient.invalidateQueries({ queryKey: voiceQuestionsQueryKey, exact: true })
      },
    }
  }, [allowed, recordingType, queryClient])
}
