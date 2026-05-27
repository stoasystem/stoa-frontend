import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Route } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const actions = [
  { label: 'Ask a question', to: '/chat', detail: 'Ask for help with a specific homework step.', icon: MessageCircle },
  { label: 'Review recent mistakes', to: '/practice/mistakes', detail: 'Return to practice steps that need one more look.', icon: Route },
  { label: 'View learning history', to: '/learning-history', detail: 'See previous questions, explanations, and progress.', icon: ArrowRight },
]

export function NextActionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Learning entry points</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-secondary/60"
            >
              <span>
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {action.label}
                </span>
                <span className="text-muted-foreground">{action.detail}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
