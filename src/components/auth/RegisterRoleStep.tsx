import { CheckCircle2, GraduationCap, UserRound, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RegisterRole } from '@/types/onboarding'

const roleOptions = [
  {
    role: 'student',
    titleKey: 'common:roles.student',
    descriptionKey: 'auth:register.studentHelp',
    icon: UserRound,
  },
  {
    role: 'parent',
    titleKey: 'common:roles.parent',
    descriptionKey: 'auth:register.parentHelp',
    icon: Users,
  },
  {
    role: 'tutor',
    titleKey: 'common:roles.tutor',
    descriptionKey: 'auth:register.tutorHelp',
    icon: GraduationCap,
  },
] satisfies Array<{
  role: RegisterRole
  titleKey: string
  descriptionKey: string
  icon: typeof UserRound
}>

export function RegisterRoleStep({
  selectedRole,
  onSelectRole,
}: {
  selectedRole: RegisterRole
  onSelectRole: (role: RegisterRole) => void
}) {
  const { t } = useTranslation(['auth', 'common'])

  return (
    <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label={t('auth:register.roleGroupLabel')}>
      {roleOptions.map((option) => {
        const Icon = option.icon
        const selected = selectedRole === option.role
        const roleLabel = t(option.titleKey)

        return (
          <button
            key={option.role}
            type="button"
            role="radio"
            className={cn(
              'relative min-h-56 rounded-lg border bg-card/86 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg',
              selected
                ? 'border-primary bg-primary/[0.08] shadow-lg ring-2 ring-primary/20'
                : 'border-border/70',
            )}
            onClick={() => onSelectRole(option.role)}
            aria-checked={selected}
            aria-label={selected ? t('auth:register.selectedRoleLabel', { role: roleLabel }) : roleLabel}
          >
            <span
              className={cn(
                'absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border transition',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card/80 text-transparent',
              )}
              aria-hidden="true"
            >
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 pr-9 text-lg font-semibold text-foreground">{roleLabel}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(option.descriptionKey)}</p>
          </button>
        )
      })}
    </div>
  )
}
