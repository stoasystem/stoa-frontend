import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AdminEnvironmentCardProps = {
  environment: string
  apiBaseUrl: string
  version: string
}

export function AdminEnvironmentCard({
  environment,
  apiBaseUrl,
  version,
}: AdminEnvironmentCardProps) {
  const items = [
    { label: 'Environment', value: environment },
    { label: 'Version', value: version },
    { label: 'API base URL', value: apiBaseUrl },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Environment basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
            <dd className="break-words text-sm text-foreground">{item.value}</dd>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
