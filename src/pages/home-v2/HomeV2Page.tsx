import { HomeV2FinalCta } from '@/components/home-v2/HomeV2FinalCta'
import { HomeV2Hero } from '@/components/home-v2/HomeV2Hero'
import { HomeV2LearningThread } from '@/components/home-v2/HomeV2LearningThread'
import { HomeV2ParentConfidence } from '@/components/home-v2/HomeV2ParentConfidence'
import { HomeV2PremiumHeader } from '@/components/home-v2/HomeV2PremiumHeader'
import { HomeV2TrustLayer } from '@/components/home-v2/HomeV2TrustLayer'
import { Seo } from '@/components/common/Seo'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { useAuthStore } from '@/store/authStore'

function getLearningHref(role?: string | null) {
  if (role === 'student') return '/practice'
  if (role === 'parent') return '/parent'
  if (role === 'tutor') return '/tutor'
  if (role === 'admin') return '/admin'
  return '/register?next=/practice'
}

export function HomeV2Page() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const learningHref = getLearningHref(isAuthenticated ? user?.role : null)

  return (
    <MarketingLayout hideHeader>
      <Seo
        title="STOA | Guided learning support"
        description="STOA helps students move from questions to clearer next steps, with teacher-backed learning support and parent visibility."
      />
      <div className="home-v2-premium">
        <HomeV2PremiumHeader />
        <HomeV2Hero learningHref={learningHref} />
        <HomeV2LearningThread />
        <HomeV2ParentConfidence />
        <HomeV2TrustLayer />
        <HomeV2FinalCta learningHref={learningHref} />
      </div>
    </MarketingLayout>
  )
}
