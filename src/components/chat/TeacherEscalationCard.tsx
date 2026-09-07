import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UpgradeRequiredDialog } from '@/components/billing/UpgradeRequiredDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useStudentEntitlementQuery } from '@/hooks/student/useStudentEntitlementQuery'

type TeacherEscalationCardProps = {
  onRequestTeacher?: () => void
  isRequesting?: boolean
  feedback?: string | null
  feedbackTone?: 'success' | 'error'
}

export function TeacherEscalationCard({
  onRequestTeacher,
  isRequesting = false,
  feedback,
  feedbackTone = 'success',
}: TeacherEscalationCardProps) {
  const { t } = useTranslation('chat')
  const entitlementQuery = useStudentEntitlementQuery()
  const teacherHelpLocked = entitlementQuery.data?.teacherSupportIncluded === false
  const requestButton = (
    <Button
      className="shrink-0"
      variant="outline"
      size="sm"
      onClick={onRequestTeacher}
      disabled={isRequesting || (!onRequestTeacher && !teacherHelpLocked)}
    >
      {isRequesting ? t('escalation.requesting') : t('escalation.requestTeacher')}
    </Button>
  )

  return (
    <div className="px-4 md:px-6">
      <Card className="mx-auto mb-4 max-w-3xl">
        <CardContent className="flex flex-col gap-4 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-md bg-secondary p-2 text-secondary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{t('needHelpFromTeacher')}</div>
              <p className="mt-1 text-muted-foreground">
                {t('escalation.prompt')}
              </p>
              {feedback && (
                <p
                  className={
                    feedbackTone === 'error'
                      ? 'mt-2 text-xs text-destructive'
                      : 'mt-2 text-xs text-emerald-600'
                  }
                >
                  {feedback}
                </p>
              )}
            </div>
          </div>
          {teacherHelpLocked ? (
            <UpgradeRequiredDialog
              reason={t('escalation.planRestricted')}
            >
              {requestButton}
            </UpgradeRequiredDialog>
          ) : (
            requestButton
          )}
        </CardContent>
      </Card>
    </div>
  )
}
