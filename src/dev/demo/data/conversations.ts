/*
 * Ask's demo conversations (#116): three learning sessions, one of them with
 * a human-help request a teacher is working on, so the status card above the
 * thread and a teacher's message both show. In the shapes Ask reads
 * (`GET /conversations`, `GET /conversations/:id`, the teacher-help status and
 * availability).
 */
import { localize, type Localized } from '@/features/starmap/fixtures/demoSky'
import type { SupportedLanguage } from '@/i18n/languages'
import type { ChatMessage, ChatRole, Conversation, ConversationListResponse } from '@/types/chat'
import type { TeacherAvailability, TeacherHelpRequest } from '@/types/teacherHelp'

const L = (en: string, de: string, fr: string, it: string): Localized => ({ en, de, fr, it })

export const DEMO_TEACHER_NAME = 'Anna Brunner'

type Spec = {
  id: string
  subject: string
  grade: string
  title: Localized
  messages: { role: ChatRole; at: string; content: Localized }[]
}

const SINE: Spec = {
  id: 'demo-ask-sine',
  subject: 'math',
  grade: '9',
  title: L('Why is sin 30° one half?', 'Warum ist sin 30° ein Halb?', 'Pourquoi sin 30° vaut-il un demi ?', 'Perché sin 30° vale un mezzo?'),
  messages: [
    {
      role: 'student',
      at: '2026-10-01T15:02:00.000Z',
      content: L(
        'Why is $\\sin 30^\\circ$ exactly 0.5?',
        'Warum ist $\\sin 30^\\circ$ genau 0,5?',
        'Pourquoi $\\sin 30^\\circ$ vaut-il exactement 0,5 ?',
        'Perché $\\sin 30^\\circ$ vale esattamente 0,5?',
      ),
    },
    {
      role: 'assistant',
      at: '2026-10-01T15:02:20.000Z',
      content: L(
        'Take an equilateral triangle with sides of 2 and cut it in half. You get a right triangle with hypotenuse 2, and the side opposite the 30° angle is 1. So $\\sin 30^\\circ = 1/2$.',
        'Nimm ein gleichseitiges Dreieck mit Seitenlänge 2 und halbiere es. Es entsteht ein rechtwinkliges Dreieck mit Hypotenuse 2; dem 30°-Winkel gegenüber liegt die Seite 1. Also ist $\\sin 30^\\circ = 1/2$.',
        "Prends un triangle équilatéral de côté 2 et coupe-le en deux. Tu obtiens un triangle rectangle d'hypoténuse 2 ; en face de l'angle de 30°, le côté mesure 1. Donc $\\sin 30^\\circ = 1/2$.",
        "Prendi un triangolo equilatero di lato 2 e taglialo a metà. Ottieni un triangolo rettangolo con ipotenusa 2; di fronte all'angolo di 30° c'è un lato lungo 1. Quindi $\\sin 30^\\circ = 1/2$.",
      ),
    },
    {
      role: 'student',
      at: '2026-10-01T15:04:00.000Z',
      content: L(
        "I still don't see why that side is 1.",
        'Ich verstehe noch nicht, warum diese Seite 1 ist.',
        'Je ne vois toujours pas pourquoi ce côté mesure 1.',
        'Non capisco ancora perché quel lato misura 1.',
      ),
    },
    {
      role: 'assistant',
      at: '2026-10-01T15:04:15.000Z',
      content: L(
        'Cutting the triangle in half also cuts its base of 2 in half, so each half is 1. If you like, a teacher can go through it with you.',
        'Beim Halbieren wird auch die Grundseite 2 halbiert, jede Hälfte ist also 1 lang. Wenn du möchtest, geht eine Lehrperson es mit dir durch.',
        "En coupant le triangle en deux, on coupe aussi sa base de 2 : chaque moitié mesure 1. Si tu veux, un enseignant peut t'expliquer.",
        "Tagliando il triangolo a metà si dimezza anche la base di 2: ogni metà misura 1. Se vuoi, un insegnante può spiegartelo.",
      ),
    },
    {
      role: 'system',
      at: '2026-10-01T15:06:00.000Z',
      content: L(
        'A teacher has joined the conversation.',
        'Eine Lehrperson ist dem Gespräch beigetreten.',
        'Un enseignant a rejoint la conversation.',
        "Un insegnante si è unito alla conversazione.",
      ),
    },
    {
      role: 'teacher',
      at: '2026-10-01T15:07:00.000Z',
      content: L(
        'Hi Lena! Draw the equilateral triangle and mark the middle of the base. What do you notice about the two halves?',
        'Hallo Lena! Zeichne das gleichseitige Dreieck und markiere die Mitte der Grundseite. Was fällt dir an den beiden Hälften auf?',
        'Bonjour Lena ! Dessine le triangle équilatéral et marque le milieu de la base. Que remarques-tu sur les deux moitiés ?',
        'Ciao Lena! Disegna il triangolo equilatero e segna il punto medio della base. Che cosa noti nelle due metà?',
      ),
    },
  ],
}

const LIGHT: Spec = {
  id: 'demo-ask-light',
  subject: 'physics',
  grade: '9',
  title: L(
    'Why does a straw look bent in water?',
    'Warum sieht ein Strohhalm im Wasser geknickt aus?',
    "Pourquoi une paille semble-t-elle pliée dans l'eau ?",
    "Perché una cannuccia sembra piegata nell'acqua?",
  ),
  messages: [
    {
      role: 'student',
      at: '2026-09-30T17:20:00.000Z',
      content: L(
        'Why does a straw look bent in a glass of water?',
        'Warum sieht ein Strohhalm im Wasserglas geknickt aus?',
        "Pourquoi une paille semble-t-elle pliée dans un verre d'eau ?",
        "Perché una cannuccia sembra piegata in un bicchiere d'acqua?",
      ),
    },
    {
      role: 'assistant',
      at: '2026-09-30T17:20:25.000Z',
      content: L(
        'Light changes direction when it passes from water into air: it is refracted. Your eye traces the light back in a straight line, so the part under water seems to be somewhere else. In optics this is refraction, and it builds on sine and cosine.',
        'Licht ändert seine Richtung, wenn es vom Wasser in die Luft übergeht: Es wird gebrochen. Dein Auge verfolgt das Licht geradlinig zurück, deshalb scheint der Teil unter Wasser verschoben. In der Optik heisst das Brechung, und sie baut auf Sinus und Kosinus auf.',
        "La lumière change de direction en passant de l'eau à l'air : elle est réfractée. Ton œil suit la lumière en ligne droite, donc la partie sous l'eau semble décalée. En optique, c'est la réfraction ; elle s'appuie sur le sinus et le cosinus.",
        "La luce cambia direzione passando dall'acqua all'aria: viene rifratta. L'occhio segue la luce in linea retta, perciò la parte sott'acqua sembra spostata. In ottica si chiama rifrazione e si basa su seno e coseno.",
      ),
    },
  ],
}

const FRACTIONS: Spec = {
  id: 'demo-ask-fractions',
  subject: 'math',
  grade: '9',
  title: L('Adding fractions', 'Brüche addieren', 'Additionner des fractions', 'Sommare frazioni'),
  messages: [
    {
      role: 'student',
      at: '2026-09-28T09:10:00.000Z',
      content: L('How do I add 1/3 and 1/4?', 'Wie addiere ich 1/3 und 1/4?', 'Comment additionner 1/3 et 1/4 ?', 'Come si sommano 1/3 e 1/4?'),
    },
    {
      role: 'assistant',
      at: '2026-09-28T09:10:12.000Z',
      content: L(
        'Find a common denominator, here 12. Then $\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.',
        'Such einen gemeinsamen Nenner, hier 12. Dann ist $\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.',
        'Cherche un dénominateur commun, ici 12. Alors $\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.',
        'Trova un denominatore comune, qui 12. Allora $\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.',
      ),
    },
  ],
}

/** Newest first, as the list is served. */
const SPECS = [SINE, LIGHT, FRACTIONS]

/** The conversation with a human-help request in progress. */
export const DEMO_HELP_CONVERSATION_ID = SINE.id

const messageStatus = (role: ChatRole): ChatMessage['status'] => (role === 'student' ? 'sent' : 'completed')

export function demoConversationsFor(language: SupportedLanguage): Conversation[] {
  return SPECS.map((spec) => {
    const messages = spec.messages.map<ChatMessage>((message, index) => ({
      id: `${spec.id}-m${index + 1}`,
      conversationId: spec.id,
      role: message.role,
      content: localize(message.content, language),
      createdAt: message.at,
      status: messageStatus(message.role),
    }))
    const last = messages[messages.length - 1]
    return {
      id: spec.id,
      title: localize(spec.title, language),
      subject: spec.subject,
      grade: spec.grade,
      updatedAt: last.createdAt,
      lastMessagePreview: last.content,
      messages,
    }
  })
}

/** `GET /conversations`: the summaries, without their messages. */
export function demoConversationListFor(language: SupportedLanguage): ConversationListResponse {
  return {
    items: demoConversationsFor(language).map(({ id, title, subject, grade, updatedAt, lastMessagePreview }) => ({
      id,
      title,
      subject,
      grade,
      updatedAt,
      lastMessagePreview,
    })),
  }
}

/** The teacher-help status per conversation; a conversation not listed was never escalated (404). */
export const demoTeacherHelpRequests: TeacherHelpRequest[] = [
  {
    requestId: 'demo-help-1',
    conversationId: DEMO_HELP_CONVERSATION_ID,
    status: 'in_progress',
    teacherName: DEMO_TEACHER_NAME,
    createdAt: '2026-10-01T15:05:00.000Z',
    updatedAt: '2026-10-01T15:07:00.000Z',
  },
]

export const demoTeacherAvailability: TeacherAvailability = { online: true, availableTeachers: 2 }
