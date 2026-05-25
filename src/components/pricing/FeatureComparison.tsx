import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const rows = [
  ['AI learning chat', 'Limited', 'Included', 'Included', 'Included'],
  ['Homework upload', 'Limited', 'Included', 'Included', 'Included'],
  ['Parent dashboard', 'Preview', '—', 'Included', 'Included'],
  ['Weekly reports', 'Preview', '—', 'Included', 'Included'],
  ['Teacher help', 'Limited', '—', '—', 'Quota included'],
]

export function FeatureComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Access matrix</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2 pr-3 font-medium">Feature</th>
              <th className="py-2 pr-3 font-medium">Trial</th>
              <th className="py-2 pr-3 font-medium">Student</th>
              <th className="py-2 pr-3 font-medium">Family</th>
              <th className="py-2 font-medium">Tutor-supported</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t">
                {row.map((cell) => (
                  <td key={cell} className="py-3 pr-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
