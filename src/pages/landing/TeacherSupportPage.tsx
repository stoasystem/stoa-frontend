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
          description="Phase 11 demonstrates the support path and availability UI without implementing tutor matching backend logic."
          actions={<Button asChild><Link to="/pricing">View tutor-supported plan</Link></Button>}
        />
        <TeacherSupportExplainer />
      </PageContainer>
    </MarketingLayout>
  )
}
