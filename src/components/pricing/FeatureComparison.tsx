import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function FeatureComparison() {
  const { t } = useTranslation('pricing')
  const headers = t('comparison.headers', { returnObjects: true }) as string[]
  const rows = t('comparison.rows', { returnObjects: true }) as string[][]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('comparison.title')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} className="py-2 pr-3 font-medium leading-5">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-t">
                {row.map((cell) => (
                  <td key={cell} className="py-3 pr-3 leading-5">
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
