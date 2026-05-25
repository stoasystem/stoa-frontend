import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string | number
  helper?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        {helper && <p className="mt-1 text-sm text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  )
}
