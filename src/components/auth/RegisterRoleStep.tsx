import { GraduationCap, UserRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RegisterRole } from '@/types/onboarding'

const roleOptions = [
  {
    role: 'student',
    title: 'Student',
    description: 'Ask homework questions and get AI-first learning help.',
    icon: UserRound,
  },
  {
    role: 'parent',
    title: 'Parent',
    description: 'Follow your child progress, reports, and teacher-help records.',
    icon: Users,
  },
  {
    role: 'tutor',
    title: 'Tutor',
    description: 'Support students when an AI explanation is not enough.',
    icon: GraduationCap,
  },
] satisfies Array<{
  role: RegisterRole
  title: string
  description: string
  icon: typeof UserRound
}>

export function RegisterRoleStep({
  selectedRole,
  onSelectRole,
}: {
  selectedRole: RegisterRole
  onSelectRole: (role: RegisterRole) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {roleOptions.map((option) => {
        const Icon = option.icon
        const selected = selectedRole === option.role

        return (
          <button
            key={option.role}
            type="button"
            className={cn(
              'rounded-xl border bg-card/86 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg',
              selected ? 'border-primary shadow-lg' : 'border-border/70',
            )}
            onClick={() => onSelectRole(option.role)}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{option.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
          </button>
        )
      })}
    </div>
  )
}
