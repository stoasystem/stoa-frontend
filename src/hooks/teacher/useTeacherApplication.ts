import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  claimTeacherInvitation,
  consumeTeacherInvitation,
  getTeacherApplicationDetail,
  getTeacherApplicationStatus,
  listTeacherApplications,
  reissueTeacherInvitation,
  reviewTeacherApplication,
  submitTeacherApplication,
  type TeacherApplicationSubmitRequest,
  type TeacherReviewState,
} from '@/services/teacher/teacherApplicationApi'

export const teacherApplicationQueryKeys = {
  all: ['teacher-applications'] as const,
  status: (applicationId: string) => [...teacherApplicationQueryKeys.all, 'status', applicationId] as const,
  list: (reviewState: TeacherReviewState) => [...teacherApplicationQueryKeys.all, 'list', reviewState] as const,
  detail: (applicationId: string, version: number) =>
    [...teacherApplicationQueryKeys.all, 'detail', applicationId, version] as const,
}

export function useSubmitTeacherApplicationMutation() {
  return useMutation({
    mutationFn: (payload: TeacherApplicationSubmitRequest) => submitTeacherApplication(payload),
  })
}

export function useTeacherApplicationStatusQuery(applicationId: string | null) {
  return useQuery({
    queryKey: teacherApplicationQueryKeys.status(applicationId ?? ''),
    queryFn: () => getTeacherApplicationStatus(applicationId as string),
    enabled: Boolean(applicationId),
    refetchInterval: (query) => {
      const state = query.state.data?.reviewState
      return state === 'pending_review' ? 15_000 : false
    },
  })
}

export function useClaimTeacherInvitationMutation() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      claimTeacherInvitation(token, password),
  })
}

export function useConsumeTeacherInvitationMutation() {
  return useMutation({
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
