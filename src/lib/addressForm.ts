import { normalizeUserRole, type UserRole } from '@/store/authStore'

/*
 * How the sign-in pages address someone whose role they know (#241). Staff
 * read their own screens formally (admin.json and teacher.json: German "Sie",
 * French "vous"; Italian stays informal), so a page that names a teacher or an
 * administrator speaks to them the same way. Students and parents, and anyone
 * whose role the page does not know, keep the auth namespace's own wording.
 *
 * The answer is an i18next context: `key_formal` is used where it exists, and
 * the plain key where it does not. A missing formal line therefore falls back
 * silently to the informal one, so every formal key is written in all four
 * languages, even where it reads the same as the plain one.
 */
const FORMAL_ROLES: ReadonlySet<UserRole> = new Set([
  'admin',
  'teacher',
  'organization_admin',
  'school_teacher',
  'school_viewer',
])

export type AddressContext = 'formal' | undefined

export function addressContext(role: unknown): AddressContext {
  if (typeof role !== 'string' || !role) return undefined
  return FORMAL_ROLES.has(normalizeUserRole(role)) ? 'formal' : undefined
}
