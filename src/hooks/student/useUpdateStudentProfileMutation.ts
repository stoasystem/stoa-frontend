import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateStudentProfile } from '@/services/student/studentApi'
import { studentQueryKeys } from '@/services/student/studentQueryKeys'
import type { StudentProfile } from '@/types/student'

export function useUpdateStudentProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Partial<StudentProfile>) => updateStudentProfile(payload),
    onSuccess: () => {
      toast.success('Profile saved')
      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() })
    },
    onError: () => {
      toast.error('Failed to save profile')
    },
  })
}
