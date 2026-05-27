import { HomeCTASection } from '@/components/home/HomeCTASection'
import { HomeHero } from '@/components/home/HomeHero'
import { HomeLearningFlow } from '@/components/home/HomeLearningFlow'
import { HomeParentVisibility } from '@/components/home/HomeParentVisibility'
import { HomePracticeEntry } from '@/components/home/HomePracticeEntry'
import { HomeTeacherFallback } from '@/components/home/HomeTeacherFallback'
import { HomeTrustSection } from '@/components/home/HomeTrustSection'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function HomePage() {
  return (
    <MarketingLayout>
      <HomeHero />
      <HomePracticeEntry />
      <HomeLearningFlow />
      <HomeTeacherFallback />
      <HomeParentVisibility />
      <HomeTrustSection />
      <HomeCTASection />
    </MarketingLayout>
  )
}
