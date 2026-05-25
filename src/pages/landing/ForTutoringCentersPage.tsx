import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function ForTutoringCentersPage() {
  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="For tutoring centers"
          title="AI plus tutor operations"
          description="A front-end path for partner discussions. Payroll, matching algorithms, scheduling enforcement, and CRM remain out of scope."
          actions={<Button asChild><Link to="/partnership/onboarding">Start pilot interest</Link></Button>}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <Card>
          <CardHeader><CardTitle>Operational fit</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>Teachers handle requests with AI context already visible.</p>
            <p>Availability setup shows future capacity planning direction.</p>
            <p>Admin analytics surfaces early demand signals for operators.</p>
          </CardContent>
        </Card>
      </PageContainer>
    </MarketingLayout>
  )
}
