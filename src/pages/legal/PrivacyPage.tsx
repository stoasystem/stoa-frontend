import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

const privacySections = [
  {
    title: 'What STOA Collects During The Pilot',
    items: [
      'Account details such as name, email address, role, and linked parent or student relationships.',
      'Learning activity such as questions, answers, conversation history, tutor help requests, feedback, and progress summaries.',
      'Uploaded learning materials when a tester chooses to attach a file or image to a learning request.',
      'Technical records needed to keep the service working, including authentication events, API errors, and basic security logs.',
    ],
  },
  {
    title: 'How STOA Uses Pilot Data',
    items: [
      'To provide AI learning support, route requests to tutors when help is needed, and show parent-facing learning summaries.',
      'To operate staging and pilot environments, diagnose product issues, improve reliability, and respond to tester feedback.',
      'To prepare aggregated product insights. Pilot reporting should avoid identifying a student unless the viewer is authorized for that student.',
    ],
  },
  {
    title: 'Sharing And Access',
    items: [
      'Parents may see learning summaries and reports for students linked to their account.',
      'Tutors and authorized STOA operators may review learning requests when needed to provide help, investigate issues, or protect the service.',
      'STOA does not sell pilot learning data. Third-party processors may be used for hosting, authentication, storage, and AI support under vendor terms.',
    ],
  },
  {
    title: 'Retention, Deletion, And Restore Expectations',
    items: [
      'Pilot accounts, demo data, and staging data may be reset as part of testing or incident recovery.',
      'Production retention schedules are not final. Before production launch, STOA should define deletion timelines for account, learning, upload, and backup records.',
      'Backups are used for continuity and restore testing. A deletion request may not immediately remove records from immutable or point-in-time backups.',
    ],
  },
]

export function PrivacyPage() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Privacy Notice"
        description="Pilot draft for STOA staging and early learning trials. This is not final production legal advice."
      />
      <section className="space-y-6 rounded-lg border bg-card p-6 text-sm leading-6 text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Pilot draft</Badge>
          <span>Last reviewed: Phase 46</span>
        </div>
        <p>
          STOA is an early-stage learning platform that helps students ask learning questions,
          receive AI-assisted support, request tutor backup, and share learning progress with
          authorized parents. This notice explains the current pilot data practices so testers know
          what to expect before production policies are finalized.
        </p>

        {privacySections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Pilot Tester Guidance</h2>
          <p>
            Testers should avoid uploading highly sensitive personal, health, financial, or
            confidential school records unless STOA has explicitly approved that testing scenario.
            Parents, students, and tutors should report privacy concerns through the pilot feedback
            process.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Before Production Launch</h2>
          <p>
            STOA should complete a legal review, confirm processor agreements, document regional
            privacy requirements, define data retention periods, and publish contact instructions
            for access, deletion, correction, and consent questions.
          </p>
        </section>

        <Button asChild variant="outline">
          <Link to="/">Back to STOA</Link>
        </Button>
      </section>
    </PageContainer>
  )
}
