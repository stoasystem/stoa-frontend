import { useEffect } from 'react'
import { TutorAssignmentBoard } from '@/components/tutor/TutorAssignmentBoard'
import { TutorScheduleOverview } from '@/components/tutor/TutorScheduleOverview'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useTutorAssignmentBoardQuery } from '@/hooks/tutor/useTutorAssignmentBoardQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function TutorAssignmentBoardPage() {
  const boardQuery = useTutorAssignmentBoardQuery()

  useEffect(() => {
    trackEvent('tutor_assignment_board_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer size="wide" className="p-0">
        <PageHeader
          eyebrow="Tutor operations"
          title="Assignment board"
          description="Request assignment workspace for matching students with available teachers."
        />
        {boardQuery.data && (
          <>
            <TutorAssignmentBoard board={boardQuery.data} />
            <TutorScheduleOverview slots={boardQuery.data.scheduleOverview} />
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  )
}
