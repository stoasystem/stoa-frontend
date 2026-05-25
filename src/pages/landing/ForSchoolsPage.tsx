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
          title="School partnership UI placeholder"
          description="A lightweight entry point for future school pilots, intentionally without multi-tenant backend scope."
          actions={<Button asChild><Link to="/support">Contact STOA</Link></Button>}
        />
        <Card>
          <CardHeader><CardTitle>What schools can evaluate</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>Homework support usage and student engagement signals.</p>
            <p>Tutor escalation operations for after-school support.</p>
            <p>Parent-facing reporting examples for pilot conversations.</p>
          </CardContent>
        </Card>
      </PageContainer>
    </MarketingLayout>
  )
}
