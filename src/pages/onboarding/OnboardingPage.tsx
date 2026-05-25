import { GraduationCap, MessageSquareText, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageContainer } from '@/components/common/PageContainer'
import { PageHeader } from '@/components/common/PageHeader'
import { OnboardingRoleGuide } from '@/components/onboarding/OnboardingRoleGuide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'

const roleGuides = [
  {
    title: 'Student setup',
    audience: 'For students joining the pilot',
    icon: MessageSquareText,
    steps: [
      {
        title: 'Confirm grade and subjects',
        description:
          'Use your profile to keep grade level and active subjects current so STOA can frame help at the right level.',
      },
      {
        title: 'Start in Chat',
        description:
          'Open Chat when you have a homework question, concept gap, or uploaded worksheet that needs explanation.',
      },
      {
        title: 'Escalate when stuck',
        description:
          'Use teacher help from Chat when the AI answer is unclear or you need a tutor to review the question.',
      },
    ],
  },
  {
    title: 'Parent visibility',
    audience: 'For parents following pilot progress',
    icon: Users,
    steps: [
      {
        title: 'Open the child dashboard',
        description:
          'The parent dashboard summarizes each child profile, recent activity, and learning signals available during the pilot.',
      },
      {
        title: 'Review reports',
        description:
          'Child reports show progress, strengths, weak areas, and recommended support without exposing private chat content by default.',
      },
      {
        title: 'Use support for access issues',
        description:
          'If a child is missing, a report looks stale, or account access is blocked, send a support request from the support page.',
      },
    ],
  },
  {
    title: 'Tutor workflow',
    audience: 'For tutors handling teacher-help requests',
    icon: GraduationCap,
    steps: [
      {
        title: 'Monitor the help request list',
        description:
          'The tutor dashboard lists open, in-progress, and resolved student requests that need human review.',
      },
      {
        title: 'Review request detail',
        description:
          'Open a request to inspect the student question context, add notes, and decide the next status.',
      },
      {
        title: 'Keep status current',
        description:
          'Move requests through open, in-progress, and resolved states so students and the pilot team can track response progress.',
      },
    ],
  },
]

export function OnboardingPage() {
  return (
    <MarketingLayout>
      <PageContainer className="space-y-8">
        <PageHeader
          eyebrow="Pilot onboarding"
          title="Get ready for the STOA pilot"
          description="A short role-specific guide for students, parents, and tutors using the pilot version of STOA."
          actions={
            <Button asChild>
              <Link to="/support">Need help?</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Controlled pilot</Badge>
              <Badge variant="outline">Student</Badge>
              <Badge variant="outline">Parent</Badge>
              <Badge variant="outline">Tutor</Badge>
            </div>
            <CardTitle className="text-xl">What to expect</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-3">
            <p>
              STOA is being tested with a small user group, so the priority is clear learning
              support, fast issue reporting, and reliable feedback.
            </p>
            <p>
              Some workflows are intentionally lightweight. Report missing data, confusing flows,
              or broken pages through Support instead of assuming they are final product behavior.
            </p>
            <p>
              Pilot feedback is reviewed by the STOA team and used to decide what should be fixed,
              documented, or expanded before a broader launch.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-3">
          {roleGuides.map((guide) => (
            <OnboardingRoleGuide key={guide.title} {...guide} />
          ))}
        </section>
      </PageContainer>
    </MarketingLayout>
  )
}
