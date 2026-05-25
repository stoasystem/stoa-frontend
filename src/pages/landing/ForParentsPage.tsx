import { useEffect } from 'react'
import { ParentHero } from '@/components/landing/ParentHero'
import { TeacherSupportExplainer } from '@/components/landing/TeacherSupportExplainer'
import { ParentValueCard } from '@/components/parent/ParentValueCard'
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
        <section className="grid gap-6 md:grid-cols-3">
          <ParentValueCard title="See learning rhythm" description="Know whether your child is asking questions and coming back to practice." />
          <ParentValueCard title="Understand weak topics" description="Reports explain what needs attention in parent-friendly language." />
          <ParentValueCard title="Keep support active" description="Tutor-supported plans make human help visible and easier to operate." />
        </section>
        <TeacherSupportExplainer />
      </PageContainer>
    </MarketingLayout>
  )
}
