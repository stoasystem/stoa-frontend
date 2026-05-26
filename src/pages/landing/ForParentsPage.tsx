import { useEffect } from 'react'
import { ParentGrowthExplainer } from '@/components/landing/ParentGrowthExplainer'
import { ParentHero } from '@/components/landing/ParentHero'
import { PageContainer } from '@/components/common/PageContainer'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { trackEvent } from '@/services/analytics/analyticsClient'

export function ForParentsPage() {
  useEffect(() => {
    trackEvent('parent_landing_viewed')
  }, [])

  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <ParentHero />
        <ParentGrowthExplainer />
      </PageContainer>
    </MarketingLayout>
  )
}
