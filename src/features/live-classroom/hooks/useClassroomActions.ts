import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  completeClassroomSession,
  joinClassroomLobby,
  joinClassroomRoom,
  leaveClassroomRoom,
} from '@/features/live-classroom/services/liveClassroomService'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useJoinClassroomLobby(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => joinClassroomLobby(sessionId ?? ''),
    onSuccess: (session) => {
      queryClient.setQueryData(liveClassroomQueryKeys.session(session.id), session)
    },
  })
}

export function useJoinClassroomRoom(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => joinClassroomRoom(sessionId ?? ''),
    onSuccess: (session) => {
      queryClient.setQueryData(liveClassroomQueryKeys.session(session.id), session)
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.studentHome() })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.tutorQueue() })
    },
  })
}

export function useLeaveClassroomRoom(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveClassroomRoom(sessionId ?? ''),
    onSuccess: () => {
      if (!sessionId) return
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.studentHome() })
    },
  })
}

export function useCompleteClassroomSession(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => completeClassroomSession(sessionId ?? ''),
    onSuccess: (session) => {
      queryClient.setQueryData(liveClassroomQueryKeys.session(session.id), session)
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.studentHome() })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.tutorQueue() })
    },
  })
}
