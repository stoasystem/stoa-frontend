import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TeacherSupportExplainer } from '@/components/landing/TeacherSupportExplainer'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function TeacherSupportPage() {
  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="Teacher support"
          title="Human backup for harder homework moments"
          description="Students ask AI first, then request a tutor inside chat when an explanation needs a human follow-up."
          actions={<Button asChild><Link to="/pricing">View tutor-supported plan</Link></Button>}
        />
        <TeacherSupportExplainer />
      </PageContainer>
    </MarketingLayout>
  )
}
