import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecommendedActionsCard({ actions }: { actions: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recommended next actions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {actions.map((action) => (
            <li key={action} className="rounded-md border p-3">{action}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
