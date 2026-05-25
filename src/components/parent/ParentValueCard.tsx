import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ParentValueCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Why this matters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          STOA helps parents see whether learning is actually happening: recent questions, weak
          topics, teacher involvement, and the next practical action.
        </p>
        <p>
          Parent reports turn homework activity into a weekly decision: continue AI support,
          request tutor backup, or review a topic together.
        </p>
      </CardContent>
    </Card>
  )
}
