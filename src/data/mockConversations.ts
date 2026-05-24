import type { Conversation } from '@/types/chat'

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Quadratic equations',
    subject: 'Mathematics',
    grade: 'Grade 8',
    updatedAt: '2026-05-24T10:00:00Z',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'student',
        content: 'Can you explain how to solve x^2 - 5x + 6 = 0?',
        createdAt: '2026-05-24T10:00:00Z',
        status: 'sent',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'assistant',
        content:
          'We can factor the expression as (x - 2)(x - 3) = 0. Therefore, the solutions are x = 2 and x = 3.',
        createdAt: '2026-05-24T10:00:10Z',
        status: 'sent',
      },
    ],
  },
  {
    id: 'conv-2',
    title: 'Newton laws',
    subject: 'Physics',
    grade: 'Grade 9',
    updatedAt: '2026-05-23T16:20:00Z',
    messages: [
      {
        id: 'msg-3',
        conversationId: 'conv-2',
        role: 'student',
        content: "What is Newton's second law?",
        createdAt: '2026-05-23T16:20:00Z',
        status: 'sent',
      },
      {
        id: 'msg-4',
        conversationId: 'conv-2',
        role: 'assistant',
        content:
          "Newton's second law says that force equals mass times acceleration. In formula form, F = ma.",
        createdAt: '2026-05-23T16:20:12Z',
        status: 'sent',
      },
    ],
  },
  {
    id: 'conv-3',
    title: 'Essay thesis review',
    subject: 'English',
    grade: 'Grade 8',
    updatedAt: '2026-05-22T13:45:00Z',
    messages: [
      {
        id: 'msg-5',
        conversationId: 'conv-3',
        role: 'student',
        content: 'Can you help me make my thesis statement more specific?',
        createdAt: '2026-05-22T13:45:00Z',
        status: 'sent',
      },
      {
        id: 'msg-6',
        conversationId: 'conv-3',
        role: 'assistant',
        content:
          'Yes. A stronger thesis should name the text, state your claim, and preview the reason you will prove.',
        createdAt: '2026-05-22T13:45:15Z',
        status: 'sent',
      },
    ],
  },
]
