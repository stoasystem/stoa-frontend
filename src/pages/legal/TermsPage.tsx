import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

const termSections = [
  {
    title: 'Pilot Access',
    body:
      'STOA pilot access is provided for evaluation, learning-flow testing, and feedback. The pilot may change, be interrupted, or reset while the product team validates the platform foundation.',
  },
  {
    title: 'Learning Content And AI Output',
    body:
      'AI responses and tutor workflows are learning aids, not guarantees of correctness. Students, parents, and tutors should review important answers independently before relying on them for schoolwork or assessment decisions.',
  },
  {
    title: 'User Responsibilities',
    body:
      'Users should provide accurate account information, use the service only for lawful learning purposes, avoid uploading confidential or highly sensitive materials during the pilot, and respect linked student and parent access boundaries.',
  },
  {
    title: 'Accounts, Resets, And Availability',
    body:
      'Pilot accounts and demo records may be reset for testing, support, or incident recovery. STOA is not committing to production uptime, data retention, paid subscription access, or service-level guarantees in this pilot draft.',
  },
  {
    title: 'Pricing And Billing Preparation',
    body:
      'Pricing and billing screens may appear in the product for planning purposes. They do not create a payment obligation until STOA publishes final commercial terms and enables an approved payment workflow.',
  },
]

export function TermsPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Terms Of Use"
        description="Pilot draft for STOA staging and early user trials. Final production terms require separate legal review."
      />
      <div className="space-y-6 rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Pilot draft</Badge>
          <span>Last reviewed: Phase 46</span>
        </div>
        <p>
          These terms describe expected use of STOA during pilot testing. They are intended to set
          clear operating expectations for testers and internal reviewers before final production
          terms are prepared.
        </p>

        {termSections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Production Readiness</h2>
          <p>
            Before STOA is offered as a production service, the product team should replace this
            pilot draft with approved legal terms covering eligibility, payment, cancellation,
            content rights, privacy, support, acceptable use, disclaimers, and dispute handling.
          </p>
        </section>

        <Button asChild variant="outline">
          <Link to="/">Back to STOA</Link>
        </Button>
      </div>
    </PageContainer>
  )
}
