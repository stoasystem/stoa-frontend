import { normalizeUserRole, useAuthStore, type UserRole } from '@/store/authStore'

/*
 * How a page shared between roles addresses a reader whose role it knows
 * (#241, #277). Each role's own namespace already speaks to it one way:
 * staff (admin.json, teacher.json) and parents (parent.json) are addressed
 * formally, German "Sie" and French "vous"; students (the student screens)
 * informally, "du" and "tu". Italian is informal for everyone.
 *
 * The answer is an i18next context. `key_formal` or `key_informal` is used
 * where it exists, and the plain key where it does not. The plain key is how
 * the page speaks to a reader it does not know: the sign-in page in German
 * says "du", the help page says "Sie", and so on. A missing context line
 * therefore falls back silently to the plain one, so every context key is
 * written in all four languages, even where it reads the same as the plain
 * one; the address-form tests check that.
 *
 * Pages only signed-in readers see (the password change, /me) write their
 * plain key informally and add only `_formal`: the informal context then lands
 * on the plain key, which is the student's.
 */
const FORMAL_ROLES: ReadonlySet<UserRole> = new Set([
  'admin',
  'teacher',
  'organization_admin',
  'school_teacher',
  'school_viewer',
  'parent',
])

// normalizeUserRole turns anything it does not recognise into a student; an
// unknown role must stay unknown here instead.
const STUDENT_SPELLINGS: ReadonlySet<string> = new Set(['student', 'students'])

export type AddressContext = 'formal' | 'informal' | undefined

export function addressContext(role: unknown): AddressContext {
  if (typeof role !== 'string' || !role) return undefined
  const normalized = normalizeUserRole(role)
  if (FORMAL_ROLES.has(normalized)) return 'formal'
  return STUDENT_SPELLINGS.has(role.trim().toLowerCase()) ? 'informal' : undefined
}

/** The address context for whoever is signed in, or undefined for nobody. */
export function useAddressContext(): AddressContext {
  return useAuthStore((state) => (state.isAuthenticated ? addressContext(state.user?.role) : undefined))
}
