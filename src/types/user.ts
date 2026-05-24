export type UserRole = 'student' | 'parent' | 'tutor' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type AuthResponse = {
  accessToken: string
  user: User
}
