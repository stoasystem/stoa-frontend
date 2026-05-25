import { useEffect } from 'react'
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
          description="Share STOA with families during early paid validation. Rewards are placeholders until backend rules are finalized."
        />
        {referralQuery.data && <InviteLinkCard referral={referralQuery.data} />}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reward placeholder</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Future paid launch work can connect successful invites to trial extension, account credit,
            or a family plan discount. Phase 11 only demonstrates the frontend flow.
          </CardContent>
        </Card>
      </PageContainer>
    </DashboardLayout>
  )
}
