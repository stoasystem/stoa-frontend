/**
 * MSW request handlers for local development.
 *
 * These mock the most frequently used API routes so the frontend can
 * be developed and demoed without a live backend.  The stubs are
 * intentionally minimal — they return just enough shape for the UI to
 * render without crashing.
 *
 * ⚠  NEVER import this file in production code.  It is only referenced
 *    from src/mocks/browser.ts which is only loaded when VITE_ENABLE_MSW=true.
 */
import { http, HttpResponse } from 'msw'

const BASE = ''  // relative — matches any origin

// ── Helpers ──────────────────────────────────────────────────────────────────

function paginatedList<T>(items: T[]) {
  return { items, nextToken: null, total: items.length }
}

function mockConversationId() {
  return `mock-conv-${Math.random().toString(36).slice(2, 9)}`
}

// ── Notification handlers ─────────────────────────────────────────────────

const notificationHandlers = [
  http.get(`${BASE}/notifications`, () =>
    HttpResponse.json(paginatedList([]))
  ),
  http.post(`${BASE}/notifications/:id/read`, () =>
    HttpResponse.json({ ok: true })
  ),
  http.post(`${BASE}/notifications/read-all`, () =>
    HttpResponse.json({ ok: true })
  ),
]

// ── Conversation handlers ─────────────────────────────────────────────────

const mockAssistantReply = {
  id: `msg-${Date.now()}`,
  role: 'assistant' as const,
  content: 'This is a mock AI response. LaTeX example: the quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.',
  createdAt: new Date().toISOString(),
  status: 'done',
}

const conversationHandlers = [
  http.get(`${BASE}/conversations`, () =>
    HttpResponse.json(paginatedList([]))
  ),

  http.post(`${BASE}/conversations`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: mockConversationId(),
      subject: body?.subject ?? 'math',
      grade: body?.grade ?? 'Grade 6',
      createdAt: new Date().toISOString(),
      messages: [],
    })
  }),

  http.get(`${BASE}/conversations/:id`, ({ params }) =>
    HttpResponse.json({
      id: params['id'],
      subject: 'math',
      grade: 'Grade 6',
      createdAt: new Date().toISOString(),
      messages: [],
    })
  ),

  http.post(`${BASE}/conversations/:id/messages`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    const userMsg = {
      id: `msg-${Date.now() - 1}`,
      role: 'student',
      content: body?.content ?? '',
      createdAt: new Date(Date.now() - 100).toISOString(),
      status: 'done',
    }
    return HttpResponse.json({
      userMessage: userMsg,
      assistantMessage: mockAssistantReply,
    })
  }),
]

// ── Teacher-help handlers ─────────────────────────────────────────────────

const teacherHelpHandlers = [
  http.post(`${BASE}/teacher-help/request`, () =>
    HttpResponse.json({ id: `req-${Date.now()}`, status: 'pending' })
  ),
  http.get(`${BASE}/teacher-help/:id`, ({ params }) =>
    HttpResponse.json({ id: params['id'], status: 'pending' })
  ),
]

// ── Identity / profile handlers ───────────────────────────────────────────

const identityHandlers = [
  http.get(`${BASE}/me`, () =>
    HttpResponse.json({
      id: 'mock-user',
      email: 'dev@stoa.local',
      role: 'student',
      firstName: 'Dev',
      lastName: 'User',
    })
  ),
]

// ── Adaptive learning handlers ────────────────────────────────────────────

const learningHandlers = [
  // Shape mirrors adaptive_learning_service._memory_response (camelCase).
  http.get(`${BASE}/students/me/memory`, () =>
    HttpResponse.json({
      studentId: 'mock-user',
      roleView: 'student',
      subjects: [{ id: 'math', label: 'Mathematics', rolloutState: 'active' }],
      weakTopics: [
        { subject: 'math', topicId: 'fractions', label: 'Fractions', count: 5, latestEvidenceAt: null, evidenceQuestionIds: [] },
        { subject: 'math', topicId: 'quadratic_equations', label: 'Quadratic equations', count: 2, latestEvidenceAt: null, evidenceQuestionIds: [] },
        { subject: 'german', topicId: 'grammar_dative', label: 'Dative case', count: 3, latestEvidenceAt: null, evidenceQuestionIds: [] },
      ],
      strengthTopics: [],
      memorySnapshots: [],
      recommendations: [
        {
          candidateId: 'remediation:math:fractions',
          type: 'remediation',
          sourceType: 'memory_snapshot',
          sourceId: 'math:fractions',
          subject: 'math',
          topicId: 'fractions',
          label: 'Review fractions',
          rationale: 'You asked 5 questions about fractions in the last two weeks.',
          confidence: 'high',
          freshness: { status: 'fresh', lastEvidenceAt: null, source: 'adaptive_sequencing' },
          reviewRequired: true,
          reviewFlags: [],
        },
        {
          candidateId: 'remediation:german:grammar_dative',
          type: 'remediation',
          sourceType: 'memory_snapshot',
          sourceId: 'german:grammar_dative',
          subject: 'german',
          topicId: 'grammar_dative',
          label: 'Practise the dative case',
          rationale: 'Recent mistakes cluster around dative endings.',
          confidence: 'medium',
          freshness: { status: 'fresh', lastEvidenceAt: null, source: 'adaptive_sequencing' },
          reviewRequired: true,
          reviewFlags: [],
        },
      ],
      sequencingSummary: {},
      freshness: {},
      updatedAt: new Date().toISOString(),
    })
  ),
  http.get(`${BASE}/learning/memory`, () =>
    HttpResponse.json({ snapshots: [], profile: {} })
  ),
  http.get(`${BASE}/learning/assignments`, () =>
    HttpResponse.json(paginatedList([]))
  ),
]

// ── Exports ───────────────────────────────────────────────────────────────

export const handlers = [
  ...notificationHandlers,
  ...conversationHandlers,
  ...teacherHelpHandlers,
  ...identityHandlers,
  ...learningHandlers,
]
