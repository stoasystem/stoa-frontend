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
          title="Professional teacher support for harder homework moments"
          description="Students start with the Learning Assistant. Qualified teachers step in when a student needs a teacher explanation, a confidence check, or a clearer next step."
          actions={
            <Button asChild className="premium-button-lift premium-primary-button hover:text-primary-foreground">
              <Link to="/register?role=tutor">Apply to teach on STOA</Link>
            </Button>
          }
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <TeacherSupportExplainer />
      </PageContainer>
    </MarketingLayout>
  )
}
