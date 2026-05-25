import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const sections = [
  {
    title: 'Learning aid',
    body: 'STOA is a learning support tool. It does not replace school instruction, parent judgment, or professional tutoring decisions.',
  },
  {
    title: 'Explanations may be wrong',
    body: 'Learning explanations can be incomplete or incorrect. Important answers should be checked by the student, parent, teacher, or tutor before relying on them.',
  },
  {
    title: 'Acceptable use',
    body: 'Users must not upload illegal, unsafe, highly sensitive, or unrelated content. Homework uploads should be limited to material needed for learning support.',
  },
  {
    title: 'Trials and subscriptions',
    body: 'Pricing and billing screens may be used for pilot and launch validation. A paid obligation begins only when STOA enables an approved payment workflow and presents final commercial terms.',
  },
  {
    title: 'Service changes',
    body: 'STOA may change, pause, or terminate access during pilot and launch operations to protect students, data, reliability, and support quality. Contact support for questions or account requests.',
  },
]

export function TermsPage() {
  return (
    <MarketingLayout>
      <PageContainer>
        <PageHeader
          eyebrow="Launch draft"
          title="Terms"
          description="Launch-ready frontend draft for STOA usage, learning support limits, subscriptions, and acceptable use."
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
