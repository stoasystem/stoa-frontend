import { useEffect } from 'react'
import { PartnershipInterestForm } from '@/components/partnership/PartnershipInterestForm'
import { PartnershipSteps } from '@/components/partnership/PartnershipSteps'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function PartnershipOnboardingPage() {
  useEffect(() => {
    trackEvent('partnership_page_viewed')
  }, [])

  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="Partnership"
          title="Pilot onboarding"
          description="Frontend-only onboarding workflow for schools and tutoring centers evaluating STOA."
        />
        <PartnershipSteps />
        <PartnershipInterestForm />
      </PageContainer>
    </MarketingLayout>
  )
}
