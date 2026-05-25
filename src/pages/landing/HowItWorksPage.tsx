import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HowItWorksSteps } from '@/components/landing/HowItWorksSteps'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function HowItWorksPage() {
  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="How it works"
          title="A simple learning support loop"
          description="STOA keeps the student workflow direct while making parent and tutor visibility possible."
          actions={<Button asChild><Link to="/pricing">Compare plans</Link></Button>}
        />
        <HowItWorksSteps />
      </PageContainer>
    </MarketingLayout>
  )
}
