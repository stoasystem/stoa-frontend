import { useQuery } from '@tanstack/react-query'
import { getTeacherClassroomQueue } from '@/features/live-classroom/services/liveClassroomService'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useTeacherClassroomQueue() {
  return useQuery({
    queryKey: liveClassroomQueryKeys.teacherQueue(),
    queryFn: getTeacherClassroomQueue,
  })
}
