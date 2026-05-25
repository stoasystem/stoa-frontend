import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const sections = [
  {
    title: 'Data we collect',
    body: 'STOA may collect account data, role, contact details, student learning activity, questions, uploaded homework metadata, support requests, feedback, analytics events, and frontend error reports.',
  },
  {
    title: 'Student learning data',
    body: 'Learning data can include recent questions, conversation metadata, weak topics, teacher-help requests, report summaries, and progress signals used to support the student and inform parents.',
  },
  {
    title: 'Parent and tutor visibility',
    body: 'Parents can see child learning summaries, reports, weak topics, and teacher involvement. Tutors can see the student context needed to answer a help request, including the relevant question and AI answer.',
  },
  {
    title: 'Use, retention, and deletion',
    body: 'Data is used to operate STOA, improve learning support, provide reports, handle support, monitor reliability, and prepare launch operations. Retention and deletion requests should be sent through support until self-service controls exist.',
  },
  {
    title: 'AI and third parties',
    body: 'AI providers, hosting, analytics, monitoring, and payment providers may process limited data under backend-controlled contracts. Browser configuration must not contain secrets or payment credentials.',
  },
]

export function PrivacyPage() {
  return (
    <MarketingLayout>
      <PageContainer>
        <PageHeader
          eyebrow="Launch draft"
          title="Privacy Policy"
          description="Launch-ready frontend draft for STOA data handling. Final legal review remains required before broad public launch."
          titleClassName="editorial-heading editorial-title-shell max-w-3xl text-4xl leading-tight md:text-6xl"
        />
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">
                {section.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </MarketingLayout>
  )
}
