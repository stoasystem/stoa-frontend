import { useQuery } from '@tanstack/react-query'
import { getStudentClassroomHome } from '@/features/live-classroom/services/liveClassroomService'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useStudentClassroomHome() {
  return useQuery({
    queryKey: liveClassroomQueryKeys.studentHome(),
    queryFn: getStudentClassroomHome,
  })
}
