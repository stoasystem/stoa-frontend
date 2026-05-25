import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type OnboardingRoleStep = {
  title: string
  description: string
}

export type OnboardingRoleGuideProps = {
  title: string
  audience: string
  icon: LucideIcon
  steps: OnboardingRoleStep[]
}

export function OnboardingRoleGuide({
  title,
  audience,
  icon: Icon,
  steps,
}: OnboardingRoleGuideProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{audience}</p>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
                {index + 1}
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-foreground">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
