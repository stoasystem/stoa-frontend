import { GraduationCap, UserRound, Users } from 'lucide-react'
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
    <div className="grid gap-3 md:grid-cols-3" role="group" aria-label={t('auth:register.roleGroupLabel')}>
      {roleOptions.map((option) => {
        const Icon = option.icon
        const selected = selectedRole === option.role

        return (
          <button
            key={option.role}
            type="button"
            className={cn(
              'rounded-lg border bg-card/86 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg',
              selected ? 'border-primary shadow-lg' : 'border-border/70',
            )}
            onClick={() => onSelectRole(option.role)}
            aria-pressed={selected}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{t(option.titleKey)}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(option.descriptionKey)}</p>
          </button>
        )
      })}
    </div>
  )
}
