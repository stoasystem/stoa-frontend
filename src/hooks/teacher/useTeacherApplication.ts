import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  claimTeacherInvitation,
  consumeTeacherInvitation,
  getTeacherApplicationDetail,
  listTeacherApplications,
  reissueTeacherInvitation,
  reviewTeacherApplication,
  type TeacherReviewState,
} from '@/services/teacher/teacherApplicationApi'

export const teacherApplicationQueryKeys = {
  all: ['teacher-applications'] as const,
  list: (reviewState: TeacherReviewState) => [...teacherApplicationQueryKeys.all, 'list', reviewState] as const,
  detail: (applicationId: string, version: number) =>
    [...teacherApplicationQueryKeys.all, 'detail', applicationId, version] as const,
}

// Both carry the invitation token, and the claim a password, which a mutation
// keeps in the query client's cache until it is collected, five minutes by
// default; gcTime 0 drops them as soon as the page no longer shows them (#409).
export function useClaimTeacherInvitationMutation() {
  return useMutation({
    gcTime: 0,
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      claimTeacherInvitation(token, password),
  })
}

export function useConsumeTeacherInvitationMutation() {
  return useMutation({
    gcTime: 0,
    mutationFn: (token: string) => consumeTeacherInvitation(token),
  })
}

export function useTeacherApplicationsQuery(reviewState: TeacherReviewState) {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.list(reviewState),
    queryFn: () => listTeacherApplications(reviewState),
    retry: false,
  })
}

export function useTeacherApplicationDetailQuery(applicationId: string | null, version: number | null) {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.detail(applicationId ?? '', version ?? 0),
    queryFn: () => getTeacherApplicationDetail(applicationId as string, version as number),
    enabled: Boolean(applicationId && version),
    retry: false,
  })
}

export function useReviewTeacherApplicationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reviewTeacherApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherApplicationQueryKeys.all })
    },
  })
}

export function useReissueTeacherInvitationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ applicationId, version }: { applicationId: string; version: number }) =>
      reissueTeacherInvitation(applicationId, version),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherApplicationQueryKeys.all })
    },
  })
}
