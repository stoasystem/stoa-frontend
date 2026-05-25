import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { MarketingLayout } from '@/layouts/MarketingLayout'

export function ForSchoolsPage() {
  return (
    <MarketingLayout>
      <PageContainer size="wide">
        <PageHeader
          eyebrow="For schools"
          title="School partnership conversations"
          description="Evaluate organization dashboards, student learning profiles, and parent report examples for a future school rollout."
          actions={<Button asChild><Link to="/partnership/onboarding">Start pilot interest</Link></Button>}
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <Card>
          <CardHeader><CardTitle>What schools can evaluate</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>Organization dashboards show student engagement and teacher-help demand.</p>
            <p>Learning profiles and weak-point diagnosis clarify where students need support.</p>
            <p>Parent monthly reports turn platform signals into family-facing value.</p>
          </CardContent>
        </Card>
      </PageContainer>
    </MarketingLayout>
  )
}
