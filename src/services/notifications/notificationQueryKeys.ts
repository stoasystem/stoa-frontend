export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationQueryKeys.all, 'list'] as const,
  // Under the list's key, so whatever refreshes the list (a read, an archive,
  // the poll, a realtime event) refreshes the bell's count with it (#373).
  unreadCount: () => [...notificationQueryKeys.list(), 'unread-count'] as const,
  adminList: () => [...notificationQueryKeys.all, 'admin'] as const,
  preferences: () => [...notificationQueryKeys.all, 'preferences'] as const,
}
