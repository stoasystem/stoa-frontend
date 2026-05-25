import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AdminUnavailableCardProps = {
  title: string
  description: string
}

export function AdminUnavailableCard({ title, description }: AdminUnavailableCardProps) {
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
