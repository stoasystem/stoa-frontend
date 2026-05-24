import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

export function PrivacyPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Privacy Notice"
        description="Testing-stage notice for STOA staging and early user trials."
      />
      <div className="space-y-4 rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <p>
          STOA processes student learning activity so the product can provide AI learning support,
          tutor help workflows, and parent-visible learning summaries.
        </p>
        <p>
          During MVP testing, parents may see summaries and reports for students linked to their
          account. Test users should avoid uploading highly sensitive personal files.
        </p>
        <p>
          This page is a placeholder for early testing. A production privacy policy will be reviewed
          separately before a production launch.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to STOA</Link>
        </Button>
      </div>
    </PageContainer>
  )
}
