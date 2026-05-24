import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

export function TermsPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Terms Placeholder"
        description="Testing-stage usage notice for STOA staging and early user trials."
      />
      <div className="space-y-4 rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <p>
          STOA staging is provided for product testing, learning-flow evaluation, and early feedback.
          It is not a production service and should not be treated as a final school or tutoring
          system.
        </p>
        <p>
          Demo and early-test accounts may be reset. Testers should report issues through the
          feedback flow and avoid uploading confidential or highly sensitive materials.
        </p>
        <p>
          Final production terms will be prepared separately before pilot launch.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to STOA</Link>
        </Button>
      </div>
    </PageContainer>
  )
}
