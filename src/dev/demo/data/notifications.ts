/* The bell's demo notifications (#116): two unread from the teacher, two read. `GET /notifications`. */
import { DEMO_KNOWLEDGE_POINT, localize, type Localized } from '@/features/starmap/fixtures/demoSky'
import { DEMO_HELP_CONVERSATION_ID, DEMO_TEACHER_NAME } from '@/dev/demo/data/conversations'
import { DEMO_STUDENT_ID } from '@/dev/demo/data/student'
import type { SupportedLanguage } from '@/i18n/languages'
import type { NotificationEvent, NotificationEventType, NotificationListResponse } from '@/types/notification'

const L = (en: string, de: string, fr: string, it: string): Localized => ({ en, de, fr, it })

type Spec = {
  eventType: NotificationEventType
  targetType: string
  targetId: string
  title: Localized
  summary: Localized
  createdAt: string
  readAt?: string
}

const SPECS: Spec[] = [
  {
    eventType: 'teacher_reply',
    targetType: 'conversation',
    targetId: DEMO_HELP_CONVERSATION_ID,
    title: L(
      `New reply from ${DEMO_TEACHER_NAME}`,
      `Neue Antwort von ${DEMO_TEACHER_NAME}`,
      `Nouvelle réponse d'${DEMO_TEACHER_NAME}`,
      `Nuova risposta da ${DEMO_TEACHER_NAME}`,
    ),
    summary: L(
      'Draw the equilateral triangle and mark the middle of the base.',
      'Zeichne das gleichseitige Dreieck und markiere die Mitte der Grundseite.',
      'Dessine le triangle équilatéral et marque le milieu de la base.',
      'Disegna il triangolo equilatero e segna il punto medio della base.',
    ),
    createdAt: '2026-10-01T15:07:00.000Z',
  },
  {
    eventType: 'teacher_takeover',
    targetType: 'conversation',
    targetId: DEMO_HELP_CONVERSATION_ID,
    title: L(
      `${DEMO_TEACHER_NAME} joined your question`,
      `${DEMO_TEACHER_NAME} hilft dir bei deiner Frage`,
      `${DEMO_TEACHER_NAME} a rejoint ta question`,
      `${DEMO_TEACHER_NAME} si è unita alla tua domanda`,
    ),
    summary: L('Why is sin 30° one half?', 'Warum ist sin 30° ein Halb?', 'Pourquoi sin 30° vaut-il un demi ?', 'Perché sin 30° vale un mezzo?'),
    createdAt: '2026-10-01T15:06:00.000Z',
  },
  {
    eventType: 'learning_profile_update',
    targetType: 'learning_profile',
    targetId: DEMO_STUDENT_ID,
    title: L(
      'Your learning summary was updated',
      'Deine Lernübersicht wurde aktualisiert',
      "Ton résumé d'apprentissage a été mis à jour",
      'Il tuo riepilogo di apprendimento è stato aggiornato',
    ),
    summary: L(
      `${DEMO_KNOWLEDGE_POINT.name.en}: 1 of 3 lessons done.`,
      `${DEMO_KNOWLEDGE_POINT.name.de}: 1 von 3 Lektionen erledigt.`,
      `${DEMO_KNOWLEDGE_POINT.name.fr} : 1 leçon faite sur 3.`,
      `${DEMO_KNOWLEDGE_POINT.name.it}: 1 lezione svolta su 3.`,
    ),
    createdAt: '2026-09-30T18:00:00.000Z',
    readAt: '2026-09-30T19:30:00.000Z',
  },
  {
    eventType: 'system_notice',
    targetType: 'system_notice',
    targetId: 'demo-welcome',
    title: L(
      'Welcome to the design preview',
      'Willkommen in der Designvorschau',
      "Bienvenue dans l'aperçu du design",
      "Benvenuto nell'anteprima del design",
    ),
    summary: L(
      'Everything here is demo data; nothing is saved.',
      'Alles hier sind Demodaten; nichts wird gespeichert.',
      "Tout ici est fictif ; rien n'est enregistré.",
      'Qui è tutto dimostrativo; non viene salvato nulla.',
    ),
    createdAt: '2026-09-28T08:00:00.000Z',
    readAt: '2026-09-28T08:05:00.000Z',
  },
]

export function demoNotificationsFor(language: SupportedLanguage): NotificationListResponse {
  const items = SPECS.map<NotificationEvent>((spec, index) => ({
    eventId: `demo-notification-${index + 1}`,
    recipientId: DEMO_STUDENT_ID,
    recipientRole: 'student',
    eventType: spec.eventType,
    targetType: spec.targetType,
    targetId: spec.targetId,
    title: localize(spec.title, language),
    summary: localize(spec.summary, language),
    status: spec.readAt ? 'read' : 'created',
    createdAt: spec.createdAt,
    readAt: spec.readAt ?? null,
    archivedAt: null,
    metadata: {},
  }))
  return { items, count: items.length }
}
