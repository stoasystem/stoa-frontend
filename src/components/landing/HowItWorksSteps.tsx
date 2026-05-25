import { Bot, FileUp, GraduationCap, MessageCircle, Newspaper } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  { title: 'Student asks', description: 'The learner starts with a question or homework photo.', Icon: MessageCircle },
  { title: 'AI explains', description: 'STOA gives a step-by-step learning answer.', Icon: Bot },
  { title: 'Upload if needed', description: 'Files keep visual homework questions in context.', Icon: FileUp },
  { title: 'Teacher helps', description: 'Tutor support is available when AI is not enough.', Icon: GraduationCap },
  { title: 'Parent sees progress', description: 'Reports translate activity into clear learning signals.', Icon: Newspaper },
]

export function HowItWorksSteps() {
  return (
    <section className="grid gap-4 md:grid-cols-5">
      {steps.map(({ title, description, Icon }) => (
        <Card key={title}>
          <CardHeader>
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">{description}</CardContent>
        </Card>
      ))}
    </section>
  )
}
