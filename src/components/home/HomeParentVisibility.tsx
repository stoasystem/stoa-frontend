import { BarChart3, Eye, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const itemIcons = [Eye, BarChart3, ShieldCheck]

export function HomeParentVisibility() {
  const { t } = useTranslation('home')
  const items = t('parents.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <div className="grid gap-8 rounded-[1.25rem] border border-border/70 bg-[#efeae2] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7e8f7c]">
            {t('parents.eyebrow')}
          </p>
          <h2 className="editorial-heading editorial-title-shell mt-5 text-4xl font-semibold leading-tight text-foreground">
            {t('parents.title')}
          </h2>
          <p className="mt-4 text-base leading-8 text-muted-foreground">
            {t('parents.body')}
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            <img
              src="https://images.pexels.com/photos/9240630/pexels-photo-9240630.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Family learning together on a laptop at home"
              className="h-56 w-full object-cover"
            />
          </div>
        </div>
        <div className="grid gap-3">
          {items.map((item, index) => {
            const Icon = itemIcons[index] ?? Eye

            return (
              <div key={item.title} className="rounded-lg border border-border/70 bg-card/82 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
