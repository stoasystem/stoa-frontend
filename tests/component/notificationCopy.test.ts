/**
 * The bell shows the backend's English notifications in the reader's language
 * when the English is exactly one of the backend's sentences, and as sent
 * otherwise (app.stoaedu.ch, 2026-10-10: a German student read "No teacher was
 * available").
 */
import type { TFunction } from 'i18next'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import deCommon from '@/i18n/locales/de/common.json'
import { notificationText } from '@/lib/notificationCopy'

const events = deCommon.notifications.events

function t() {
  return i18n.getFixedT('de', ['common', 'chat']) as unknown as TFunction<['common', 'chat']>
}

function event(eventType: string, targetType: string, title: string, summary: string, metadata: Record<string, unknown> = {}) {
  return { eventType, targetType, title, summary, metadata } as Parameters<typeof notificationText>[0]
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
})

describe('notification text in the reader language', () => {
  it.each([
    ['teacher_takeover', 'question', 'Teacher joined your question', 'A teacher has started working on your question.', events.takeoverQuestion],
    ['teacher_takeover', 'conversation', 'A teacher joined your conversation', 'A teacher has started working on your request.', events.takeoverConversation],
    ['teacher_reply', 'question', 'Teacher replied', 'Your teacher added a reply to your question.', events.replyQuestion],
    ['teacher_reply', 'conversation', 'Your teacher replied', 'Your teacher answered in your conversation.', events.replyConversation],
    ['teacher_help_expired', 'conversation', 'No teacher was available', 'Your request for a teacher expired.', events.helpExpired],
    ['teacher_help_expired', 'conversation', 'No teacher was available', "Your request for a teacher expired. This week's teacher help was given back.", events.helpExpiredReturned],
  ])('%s on a %s says what the backend said, in German', (type, target, title, summary, german) => {
    expect(notificationText(event(type, target, title, summary), t())).toEqual(german)
  })

  it('names the subject of a help request in the reader language', () => {
    const text = notificationText(
      event('teacher_requested', 'question', 'Teacher help requested', 'A student requested help for a math question.', { subject: 'math' }),
      t(),
    )
    expect(text.title).toBe(events.helpRequested.title)
    expect(text.summary).toBe('Eine Schülerin oder ein Schüler bittet um Hilfe bei einer Frage in Mathematik.')
  })

  it('shows a sentence the backend has reworded as it was sent', () => {
    const sent = event('teacher_reply', 'question', 'Teacher replied', 'Your teacher replied twice.')
    expect(notificationText(sent, t())).toEqual({ title: 'Teacher replied', summary: 'Your teacher replied twice.' })
  })

  it('shows an event it has no translation for as it was sent', () => {
    const sent = event('moderation_case_update', 'case', 'Moderation case updated', 'Moderation case status is open.')
    expect(notificationText(sent, t())).toEqual({ title: 'Moderation case updated', summary: 'Moderation case status is open.' })
  })

  it('does not take one target type for another', () => {
    const sent = event('teacher_reply', 'conversation', 'Teacher replied', 'Your teacher added a reply to your question.')
    expect(notificationText(sent, t()).title).toBe('Teacher replied')
  })

  it('has every translation in all four languages', () => {
    for (const language of ['de', 'en', 'fr', 'it']) {
      for (const key of Object.keys(events)) {
        for (const part of ['title', 'summary']) {
          expect(i18n.exists(`common:notifications.events.${key}.${part}`, { lng: language }), `${language} ${key}.${part}`).toBe(true)
        }
      }
    }
  })
})
