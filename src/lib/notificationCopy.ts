import type { TFunction } from 'i18next'
import type { NotificationEvent } from '@/types/notification'

/*
 * The backend stores each notification's title and summary in English, from a
 * fixed set of sentences in `notification_service.py`, and sends them as they
 * are whatever the reader's language: a German student read "No teacher was
 * available" in a German bell (app.stoaedu.ch, 2026-10-10).
 *
 * A notification is shown in the reader's language only when its English is
 * exactly one of those sentences, so the translation says what the backend
 * said. Anything else - a sentence the backend has since reworded - is shown
 * as the backend sent it, rather than guessed at.
 *
 * The English below is never shown: it is the backend's wording, matched to
 * pick a translation, and lives here rather than beside the bell so the
 * untranslated-copy check reads it as the data it is.
 *
 * A notification sent to a whole role ("New moderation case", "Teacher help
 * requested") is not here: the backend renders it in each reader's language
 * when the list is read (stoa-backend#161), so it is shown as sent (#518).
 */

type Copy = { key: string; title: string; summary: string }

// untranslated-ok: the backend's English, matched to pick a translation, never shown.
const KNOWN: Record<string, Copy[]> = {
  'teacher_takeover:question': [
    { key: 'takeoverQuestion', title: 'Teacher joined your question', summary: 'A teacher has started working on your question.' },
  ],
  'teacher_takeover:conversation': [
    { key: 'takeoverConversation', title: 'A teacher joined your conversation', summary: 'A teacher has started working on your request.' },
  ],
  'teacher_reply:question': [
    { key: 'replyQuestion', title: 'Teacher replied', summary: 'Your teacher added a reply to your question.' },
  ],
  'teacher_reply:conversation': [
    { key: 'replyConversation', title: 'Your teacher replied', summary: 'Your teacher answered in your conversation.' },
  ],
  'teacher_help_expired:conversation': [
    { key: 'helpExpiredReturned', title: 'No teacher was available', summary: "Your request for a teacher expired. This week's teacher help was given back." },
    { key: 'helpExpired', title: 'No teacher was available', summary: 'Your request for a teacher expired.' },
  ],
}

/** The title and summary to show, in the reader's language where the English is known. */
export function notificationText(
  event: Pick<NotificationEvent, 'eventType' | 'targetType' | 'title' | 'summary'>,
  t: TFunction<['common', 'chat']>,
): { title: string; summary: string } {
  const candidates = KNOWN[`${event.eventType}:${event.targetType}`] ?? []
  const match = candidates.find((copy) => copy.title === event.title && copy.summary === event.summary)
  if (!match) return { title: event.title, summary: event.summary }
  return {
    title: t(`common:notifications.events.${match.key}.title`),
    summary: t(`common:notifications.events.${match.key}.summary`),
  }
}
