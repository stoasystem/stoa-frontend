import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const actions = [
  { label: 'Continue last conversation', to: '/chat', detail: 'Pick up the current homework thread.' },
  { label: 'Review weak topic', to: '/learning-history', detail: 'Use history to revisit recent gaps.' },
  { label: 'Upload homework question', to: '/chat', detail: 'Attach a photo or PDF before asking.' },
  { label: 'Ask a teacher', to: '/chat', detail: 'Ask for professional teacher support when the explanation is not enough.' },
]

export function NextActionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Next recommended action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-secondary/60"
          >
            <span>
              <span className="block font-medium text-foreground">{action.label}</span>
              <span className="text-muted-foreground">{action.detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
