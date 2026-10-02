/*
 * Where the design preview's demo data comes from: the one module the
 * preview's request handlers read (#115).
 *
 * TODO(#116): the demo dataset lands in `src/dev/demo/data/index.ts` and
 * exports `demoStudent`, `demoProfile`, `demoNotifications`,
 * `demoConversations` and `demoChapter` (and re-exports the star-map demo
 * maps). When it does, replace the stubs below with
 *
 *   export { demoStudent, demoProfile, demoNotifications, demoConversations, demoChapter } from '@/dev/demo/data'
 *
 * and delete them. Until then these are deliberately tiny: one student, one
 * notification, one conversation, one chapter of two lessons with two
 * exercises, typed with the app's own types so a shape #116 changes shows up
 * here as a type error, not as a blank screen.
 *
 * The chapter's unit is the first star of the 1000 / 2000 star maps
 * (`u-1-1`), so its star card opens it.
 */
import type { Conversation } from '@/types/chat'
import type { NotificationEvent } from '@/types/notification'
import type { CurriculumCatalog, PracticeLesson, PracticeRoadmap } from '@/types/practice'
import type { StudentProfile } from '@/types/student'
import type { User } from '@/types/user'

/** A chapter as the practice API serves it: the catalog row, the roadmap, and each lesson. */
export type DemoChapter = {
  catalog: CurriculumCatalog
  roadmap: PracticeRoadmap
  lessons: PracticeLesson[]
}

const at = '2026-10-01T08:00:00.000Z'

export const demoStudent: User = {
  id: 'demo-student',
  name: 'Lina Meier',
  email: 'lina@example.test',
  role: 'student',
  preferredLocale: 'en',
  effectiveLocale: 'en',
  supportedLocales: ['de', 'en', 'fr', 'it'],
  emailVerificationStatus: 'verified',
}

export const demoProfile: StudentProfile = {
  id: 'demo-profile',
  userId: demoStudent.id,
  name: demoStudent.name,
  email: demoStudent.email,
  grade: 'Grade 7',
  primarySubjects: ['math'],
  preferredAnswerLanguage: 'en',
  guardianStatus: 'not_linked',
  createdAt: at,
  updatedAt: at,
}

export const demoNotifications: NotificationEvent[] = [
  {
    eventId: 'demo-notification-1',
    recipientId: demoStudent.id,
    recipientRole: 'student',
    eventType: 'teacher_reply',
    targetType: 'conversation',
    targetId: 'demo-conversation-1',
    title: 'Your teacher replied',
    summary: 'A note on adding fractions with different denominators.',
    status: 'created',
    createdAt: at,
    metadata: {},
  },
]

export const demoConversations: Conversation[] = [
  {
    id: 'demo-conversation-1',
    title: 'Adding fractions',
    subject: 'math',
    grade: 'Grade 7',
    updatedAt: at,
    lastMessagePreview: 'Find a common denominator first.',
    messages: [
      { id: 'demo-message-1', conversationId: 'demo-conversation-1', role: 'student', content: 'How do I add 1/3 and 1/4?', createdAt: at, status: 'completed' },
      { id: 'demo-message-2', conversationId: 'demo-conversation-1', role: 'assistant', content: 'Find a common denominator first: $\\frac{1}{3} + \\frac{1}{4} = \\frac{4}{12} + \\frac{3}{12} = \\frac{7}{12}$.', createdAt: at, status: 'completed' },
    ],
  },
]

const unit = { subjectId: 'math', gradeLevel: 'grade-7', topicId: 'demo-topic', unitId: 'u-1-1' }

export const demoChapter: DemoChapter = {
  catalog: {
    subjects: [{ id: 'math', name: 'Mathematics', description: '', gradeLevels: [], language: 'en', rolloutState: 'active', order: 1 }],
    topics: [{ id: unit.topicId, subjectId: 'math', gradeLevel: unit.gradeLevel, title: 'Fractions', description: '', rolloutState: 'active', order: 1 }],
    units: [{ id: unit.unitId, subjectId: 'math', gradeLevel: unit.gradeLevel, topicId: unit.topicId, title: 'Adding fractions', description: '', rolloutState: 'active', order: 1 }],
    lessons: [
      { id: 'demo-lesson-1', ...unit, title: 'Same denominator', objective: '', difficulty: 'intro', estimatedMinutes: 5, rolloutState: 'active', exerciseCount: 1, source: 'demo' },
      { id: 'demo-lesson-2', ...unit, title: 'Different denominators', objective: '', difficulty: 'practice', estimatedMinutes: 8, rolloutState: 'active', exerciseCount: 1, source: 'demo' },
    ],
    rolloutSubjects: ['math'],
    includePreview: false,
    source: 'demo',
  },
  roadmap: {
    subjectId: 'math',
    topicId: unit.topicId,
    gradeLevel: unit.gradeLevel,
    topic: { id: unit.topicId, subjectId: 'math', gradeLevel: unit.gradeLevel, title: 'Fractions', description: '', progress: 0.5 },
    progress: 0.5,
    currentLessonId: 'demo-lesson-2',
    units: [{
      id: unit.unitId,
      title: 'Adding fractions',
      description: '',
      order: 1,
      lessons: [
        { id: 'demo-lesson-1', ...unit, title: 'Same denominator', order: 1, status: 'completed', estimatedMinutes: 5, challengeCount: 1 },
        { id: 'demo-lesson-2', ...unit, title: 'Different denominators', order: 2, status: 'current', estimatedMinutes: 8, challengeCount: 1 },
      ],
    }],
  },
  lessons: [
    {
      id: 'demo-lesson-1', ...unit, title: 'Same denominator', topic: 'Fractions', difficulty: 'intro', status: 'completed', estimatedMinutes: 5,
      challenges: [{
        id: 'demo-exercise-1', lessonId: 'demo-lesson-1', ...unit, topic: 'Fractions', type: 'multiple_choice',
        prompt: 'What is $\\frac{1}{5} + \\frac{2}{5}$?', options: ['$\\frac{3}{5}$', '$\\frac{3}{10}$', '$\\frac{2}{25}$'], correctAnswer: '$\\frac{3}{5}$',
        explanation: 'Same denominator: add the numerators.',
      }],
    },
    {
      id: 'demo-lesson-2', ...unit, title: 'Different denominators', topic: 'Fractions', difficulty: 'practice', status: 'available', estimatedMinutes: 8,
      challenges: [{
        id: 'demo-exercise-2', lessonId: 'demo-lesson-2', ...unit, topic: 'Fractions', type: 'multiple_choice',
        prompt: 'What is $\\frac{1}{3} + \\frac{1}{4}$?', options: ['$\\frac{2}{7}$', '$\\frac{7}{12}$', '$\\frac{1}{12}$'], correctAnswer: '$\\frac{7}{12}$',
        hint: 'Write both fractions over 12.', explanation: '4/12 + 3/12 = 7/12.',
      }],
    },
  ],
}
