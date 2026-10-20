import { create } from 'zustand'

/*
 * Whether the notification queries poll (#413). The bell's realtime
 * connection turns it on while someone is signed in and the socket is not
 * live, and off again once it is: a live socket merges every event in. The
 * queries poll with their own `refetchInterval`, so a tab that is not shown
 * sends nothing; the connection's own timer used to refetch them every 30 s
 * in every open tab, shown or not.
 */
type NotificationPollState = {
  polling: boolean
}

export const useNotificationPollStore = create<NotificationPollState>(() => ({ polling: false }))
