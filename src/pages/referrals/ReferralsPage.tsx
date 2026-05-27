import { useEffect, type ReactNode } from 'react'
import { CheckCircle2, Clock3, Gift } from 'lucide-react'
import { InviteLinkCard } from '@/components/referrals/InviteLinkCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { useReferralQuery } from '@/hooks/referrals/useReferralQuery'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ReferralsPage() {
  const referralQuery = useReferralQuery()

  useEffect(() => {
    trackEvent('referral_page_viewed')
  }, [])

  return (
    <DashboardLayout>
      <PageContainer className="p-0">
        <PageHeader
          eyebrow="Referral"
          title="Invite another family"
          description="Share STOA with families and track invited-family interest."
        />
        {referralQuery.data && <InviteLinkCard referral={referralQuery.data} />}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite rewards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <RewardNote
              icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              title="Invites are tracked now"
              text="Each family that registers from your link is saved on this account, so your invite history is not lost."
            />
            <RewardNote
              icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
              title="Rewards are reviewed before billing"
              text="When a family starts a paid plan, STOA can confirm the invite and apply the eligible benefit before the next billing decision."
            />
            <RewardNote
              icon={<Gift className="h-4 w-4" aria-hidden="true" />}
              title="Possible benefits"
              text="Depending on the final referral terms, this may become extra trial time, account credit, or a family plan discount."
            />
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}

function RewardNote({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-md border bg-[hsl(var(--platform-surface-app))] p-3">
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1">{text}</p>
      </div>
    </div>
  )
}
