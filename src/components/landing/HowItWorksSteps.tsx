import { FileUp, GraduationCap, Lightbulb, MessageCircle, Newspaper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    title: 'Student asks',
    description:
      'The learner can begin from a homework question, a short Practice Path challenge, or a photo of the exercise.',
    detail:
      'STOA keeps the first step low-friction: the student does not need to know exactly what is wrong before asking.',
    Icon: MessageCircle,
  },
  {
    title: 'Learning Assistant explains',
    description:
      'The Learning Assistant breaks the problem into clear steps and focuses on the next useful move.',
    detail:
      'Instead of only giving a final answer, it helps the student understand the reasoning and continue independently.',
    Icon: Lightbulb,
  },
  {
    title: 'Upload if needed',
    description:
      'When the question depends on a worksheet, diagram, or written work, the student can keep that file in context.',
    detail:
      'This makes the explanation more specific, especially for visual homework or multi-part school tasks.',
    Icon: FileUp,
  },
  {
    title: 'Teacher helps',
    description:
      'If the explanation is still not enough, the student can escalate the request to professional teacher support.',
    detail:
      'The teacher sees the learning context first, so support starts from the exact point where the student got stuck.',
    Icon: GraduationCap,
  },
  {
    title: 'Parent sees progress',
    description:
      'Parents see the learning activity without needing to interrupt the student workflow.',
    detail:
      'Reports turn questions, practice attempts, explanations, and support requests into clear progress signals.',
    Icon: Newspaper,
  },
]

export function HowItWorksSteps() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {steps.map(({ title, description, detail, Icon }) => (
        <Card key={title}>
          <CardHeader>
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>{description}</p>
            <p>{detail}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
