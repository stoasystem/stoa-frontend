import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const actions = [
  { key: 'ask', to: '/chat', icon: MessageCircle },
  { key: 'mistakes', to: '/practice/mistakes', icon: Route },
  { key: 'history', to: '/learning-history', icon: ArrowRight },
] as const

export function NextActionCard() {
  const { t } = useTranslation('practice')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.entryPoints')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.key}
              to={action.to}
              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-secondary/60"
            >
              <span>
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t(`dashboard.entries.${action.key}Label`)}
                </span>
                <span className="text-muted-foreground">
                  {t(`dashboard.entries.${action.key}Detail`)}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}
