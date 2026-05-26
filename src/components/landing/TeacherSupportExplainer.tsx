import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  GraduationCap,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const teacherClassroomImageUrl = new URL('../../../img/teacher-classroom.jpeg', import.meta.url).href

const participationSteps = [
  {
    title: 'Student asks first',
    description: 'The Learning Assistant helps the student start, clarify the question, and try the next step.',
    Icon: MessageSquareText,
  },
  {
    title: 'Teacher joins with context',
    description: 'When help is requested, the teacher sees the question, subject, grade, and prior explanation.',
    Icon: GraduationCap,
  },
  {
    title: 'Support stays in the thread',
    description: 'The teacher answers inside the same learning thread so the student does not need to restart.',
    Icon: Users,
  },
]

const responsibilities = [
  'Explain the next step in a calm, age-appropriate way instead of simply giving final answers.',
  'Review the student question, previous explanation, grade level, and subject before responding.',
  'Record the support outcome so parents and STOA operations can understand what happened.',
  'Escalate unclear, unsafe, or out-of-scope cases instead of improvising beyond the platform role.',
]

const applicationSteps = [
  {
    title: 'Apply',
    description: 'Submit your teaching subjects, education background, experience, and credential file.',
  },
  {
    title: 'Review',
    description: 'STOA checks your profile, teaching fit, and uploaded proof of qualification.',
  },
  {
    title: 'Interview',
    description: 'We schedule a short conversation about teaching style, availability, and student support norms.',
  },
  {
    title: 'Approval',
    description: 'Approved teachers receive dashboard access and can start handling student requests.',
  },
]

export function TeacherSupportExplainer() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>How teachers participate in the learning platform</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[0.72fr_1fr] lg:items-center">
          <div className="brand-image-panel relative min-h-80 overflow-hidden">
            <img
              src={teacherClassroomImageUrl}
              alt="Teacher speaking with students in a classroom"
              className="absolute inset-0 h-full w-full object-cover opacity-78"
            />
            <div className="brand-image-overlay absolute inset-0" />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-white/15 bg-[hsl(var(--stoa-brand-card)_/_0.92)] p-4 text-[hsl(var(--stoa-brand-ink))] backdrop-blur">
              <p className="brand-section-kicker text-[hsl(var(--stoa-brand-burgundy))]">
                Teacher support, connected to the thread
              </p>
              <p className="mt-2 text-sm leading-6">
                Teachers do not replace the Learning Assistant. They join when a student needs a qualified teacher to clarify, check, or guide the next step.
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            {participationSteps.map(({ title, description, Icon }) => (
              <div className="flex gap-4 rounded-lg border bg-background/70 p-4" key={title}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>What teachers are responsible for</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responsibilities.map((item) => (
                <div className="flex gap-3 text-sm leading-6 text-muted-foreground" key={item}>
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to become a STOA teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {applicationSteps.map(({ title, description }) => (
                <div className="rounded-lg border bg-background/70 p-4" key={title}>
                  <div className="flex items-center gap-2">
                    {title === 'Approval' ? (
                      <BadgeCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    ) : (
                      <ClipboardCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    )}
                    <h3 className="font-semibold text-foreground">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-primary/30 bg-[hsl(var(--stoa-brand-burgundy-soft)_/_0.72)] p-5">
              <p className="max-w-2xl text-sm leading-6 text-foreground">
                Teacher accounts are not activated immediately after registration. Submit your application first; dashboard access is opened only after review and interview approval.
              </p>
              <Button
                asChild
                className="premium-button-lift mt-5 min-h-12 w-full justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-strong))] px-5 py-3 text-sm font-semibold !text-[hsl(var(--primary-foreground))] shadow-[0_14px_30px_hsl(var(--stoa-brand-burgundy)_/_0.22)] hover:bg-[hsl(var(--stoa-brand-charcoal))] hover:!text-[hsl(var(--primary-foreground))] sm:w-auto sm:text-base"
              >
                <Link to="/register?role=tutor">
                  Apply to teach on STOA
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
