import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

type AdminOperationCardProps = {
  title: string
  description: string
  to: string
}

export function AdminOperationCard({ title, description, to }: AdminOperationCardProps) {
  return (
    <Link to={to} className="block">
      <Card className="h-full transition-colors hover:bg-secondary/40">
        <CardContent className="flex h-full items-start justify-between gap-4 p-4">
          <div className="min-w-0 space-y-2">
            <h2 className="font-medium text-foreground">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    </Link>
  )
}
