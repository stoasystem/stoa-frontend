import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AdminBackendPendingProps = {
  title: string
  description: string
}

export function AdminBackendPending({ title, description }: AdminBackendPendingProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
