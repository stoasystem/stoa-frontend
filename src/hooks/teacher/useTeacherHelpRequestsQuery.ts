import { useQuery } from '@tanstack/react-query'
import { getTeacherHelpRequests } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

// Polling stands in for push until the realtime channel exists (card 107):
// without it a teacher saw a new request only after reloading, and an offer
// nobody accepts lapses after ten minutes (stoasystem/stoa-backend#30).
export function useTeacherHelpRequestsQuery() {
  return useQuery({
    queryKey: teacherQueryKeys.helpRequests(),
    queryFn: getTeacherHelpRequests,
    refetchInterval: 15_000,
    // Only poll when the tab is visible — no background traffic
    refetchIntervalInBackground: false,
    // The app turns this off by default; coming back to the tab is exactly
    // when a teacher expects to see what arrived while they were away.
    refetchOnWindowFocus: true,
  })
}
