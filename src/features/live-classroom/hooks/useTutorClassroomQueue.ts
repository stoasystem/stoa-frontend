import { useQuery } from '@tanstack/react-query'
import { getTutorClassroomQueue } from '@/features/live-classroom/services/liveClassroomService'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useTutorClassroomQueue() {
  return useQuery({
    queryKey: liveClassroomQueryKeys.tutorQueue(),
    queryFn: getTutorClassroomQueue,
  })
}
