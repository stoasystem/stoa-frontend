import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AskQuestionCard() {
  return (
    <Card className="bg-card/90">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-primary">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="brand-section-kicker">Explanation center</p>
            <CardTitle className="text-xl">Have a specific homework question?</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">
          Open Learning Chat for a step-by-step explanation. Use it directly for homework,
          or enter from Practice when a lesson step needs clearer guidance.
        </p>
        <div className="rounded-lg border bg-[hsl(var(--platform-surface-app))] p-4 text-sm leading-6">
          Practice helps you start. Learning Chat helps you understand the step that is unclear.
        </div>
        <Button asChild variant="outline">
          <Link to="/chat">
            Open Learning Chat
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
