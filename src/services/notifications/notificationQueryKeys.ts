export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationQueryKeys.all, 'list'] as const,
  adminList: () => [...notificationQueryKeys.all, 'admin'] as const,
  preferences: () => [...notificationQueryKeys.all, 'preferences'] as const,
}
