import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  Check,
  LibraryBig,
  Mic,
  Paperclip,
  Plus,
  RotateCcw,
  Send,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StoaLogo } from '@/components/common/StoaLogo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type AssistantIntent = 'explain' | 'practice' | 'review' | 'book' | 'upload'

type ChatTurn = {
  id: string
  role: 'student' | 'assistant'
  text: string
  intent?: AssistantIntent
}

type ToolAction = {
  id: AssistantIntent
  label: string
  detail: string
  Icon: LucideIcon
}

const toolActions: ToolAction[] = [
  {
    id: 'upload',
    label: 'Upload homework',
    detail: 'Photo, PDF, worksheet',
    Icon: Paperclip,
  },
  {
    id: 'practice',
    label: 'Practice equations',
    detail: 'Short adaptive set',
    Icon: BookOpenCheck,
  },
  {
    id: 'review',
    label: 'Review mistakes',
    detail: 'What needs one more pass',
    Icon: RotateCcw,
  },
  {
    id: 'book',
    label: 'Book a tutor',
    detail: 'Schedule live help',
    Icon: CalendarClock,
  },
]

const initialTurns: ChatTurn[] = [
  {
    id: 'assistant-opening',
    role: 'assistant',
    text: 'Tell me what you want to do. I can open the right learning tool inside this conversation.',
  },
]

export function StudentAssistantEntryPage() {
  const [inputValue, setInputValue] = useState('')
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns)
  const [activeIntent, setActiveIntent] = useState<AssistantIntent | null>(null)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  const activeTitle = useMemo(() => {
    if (!activeIntent) return 'New conversation'
    if (activeIntent === 'book') return 'Tutor booking'
    if (activeIntent === 'review') return 'Mistake review'
    if (activeIntent === 'upload') return 'Homework upload'
    if (activeIntent === 'explain') return 'Step explanation'
    return 'Adaptive practice'
  }, [activeIntent])

  function submitPrompt(prompt = inputValue, intent?: AssistantIntent) {
    const trimmed = prompt.trim()
    if (!trimmed) return

    const nextIntent = intent ?? detectIntent(trimmed)
    setActiveIntent(nextIntent)
    setTurns((current) => [
      ...current,
      {
        id: `student-${Date.now()}`,
        role: 'student',
        text: trimmed,
      },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseForIntent(nextIntent),
        intent: nextIntent,
      },
    ])
    setInputValue('')
    setToolsOpen(false)
    if (nextIntent === 'book') setBookingOpen(true)
  }

  function triggerTool(intent: AssistantIntent) {
    const tool = toolActions.find((item) => item.id === intent)
    submitPrompt(tool ? tool.label : 'Help me learn', intent)
  }

  return (
    <div className="min-h-screen bg-[hsl(47_31%_96%)] text-[hsl(20_12%_8%)]">
      <div className="grid min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-[hsl(31_18%_78%)] bg-[hsl(28_18%_13%)] px-4 py-5 text-[hsl(42_36%_94%)] lg:block">
          <div className="inline-flex items-center" aria-label="STOA">
            <StoaLogo variant="light" size="sm" className="h-9" />
          </div>

          <nav className="mt-8 space-y-1" aria-label="Student mode">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[hsl(42_36%_94%_/_0.76)] transition hover:bg-[hsl(42_36%_94%_/_0.08)] hover:text-[hsl(42_36%_94%)]"
            >
              <LibraryBig className="h-4 w-4" aria-hidden="true" />
              Classic dashboard
            </Link>
          </nav>

          <div className="mt-8 border-t border-[hsl(42_36%_94%_/_0.14)] pt-5">
            <p className="text-xs font-semibold uppercase tracking-normal text-[hsl(42_36%_94%_/_0.56)]">
              Current thread
            </p>
            <div className="mt-3 rounded-lg border border-[hsl(42_36%_94%_/_0.14)] bg-[hsl(42_36%_94%_/_0.07)] p-3">
              <p className="text-sm font-semibold">{activeTitle}</p>
              <p className="mt-2 text-xs leading-5 text-[hsl(42_36%_94%_/_0.66)]">
                Language first, tools when needed.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen min-w-0 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b border-[hsl(31_18%_78%)] bg-[hsl(47_31%_96%_/_0.9)] px-4 backdrop-blur md:px-6">
            <div className="min-w-0">
              <StoaLogo size="md" className="h-12" />
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard">Classic UI</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/chat">
                  Open Chat
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </header>

          <section className="flex flex-1 flex-col px-4 py-5 md:px-6">
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto pb-4">
                {turns.map((turn) => (
                  <ChatBubble
                    key={turn.id}
                    turn={turn}
                    onBook={() => setBookingOpen(true)}
                    onPractice={() => setActiveIntent('practice')}
                  />
                ))}
                {bookingConfirmed && (
                  <section className="ml-auto max-w-xl rounded-lg border border-[hsl(151_42%_38%_/_0.35)] bg-[hsl(151_45%_95%)] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(151_42%_38%)] text-white">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold">Tutor session booked</p>
                        <p className="mt-1 text-sm leading-6 text-[hsl(151_20%_28%)]">
                          Anna Keller, today 17:30. Topic: linear equations with school worksheet.
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <form
                className="sticky bottom-4 rounded-lg border border-[hsl(31_18%_78%)] bg-[hsl(38_45%_99%)] p-3 shadow-[0_24px_70px_hsl(24_9%_13%_/_0.12)]"
                onSubmit={(event) => {
                  event.preventDefault()
                  submitPrompt()
                }}
              >
                {toolsOpen && (
                  <div className="mb-3 grid gap-2 sm:grid-cols-2">
                    {toolActions.map(({ id, label, detail, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        className="flex min-h-14 items-center gap-3 rounded-md border border-[hsl(31_18%_78%)] bg-[hsl(47_31%_96%)] px-3 text-left transition hover:border-[hsl(352_59%_35%_/_0.45)] hover:bg-[hsl(349_42%_91%)]"
                        onClick={() => triggerTool(id)}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[hsl(352_59%_35%)]" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{label}</span>
                          <span className="block truncate text-xs text-[hsl(24_8%_39%)]">{detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={toolsOpen ? 'Close tools' : 'Open tools'}
                    onClick={() => setToolsOpen((open) => !open)}
                  >
                    {toolsOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Voice input"
                    onClick={() => setInputValue('I want to book a tutor for this homework problem.')}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Ask for help, practice, review, or a tutor..."
                    className="min-h-12 resize-none border-0 bg-transparent px-1 py-2 text-base shadow-none focus-visible:ring-0"
                    aria-label="Ask STOA Assistant"
                  />
                  <Button type="submit" size="icon" aria-label="Send message" disabled={!inputValue.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>

      <TutorBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        onConfirm={() => {
          setBookingConfirmed(true)
          setBookingOpen(false)
          setActiveIntent('book')
        }}
      />
    </div>
  )
}

function ChatBubble({
  turn,
  onBook,
  onPractice,
}: {
  turn: ChatTurn
  onBook: () => void
  onPractice: () => void
}) {
  const student = turn.role === 'student'

  return (
    <div className={student ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          student
            ? 'max-w-xl rounded-lg bg-[hsl(28_18%_13%)] px-4 py-3 text-[hsl(42_36%_94%)]'
            : 'max-w-2xl rounded-lg border border-[hsl(31_18%_78%)] bg-[hsl(38_45%_99%)] px-4 py-3 shadow-[0_10px_28px_hsl(24_9%_13%_/_0.045)]'
        }
      >
        <p className="text-sm leading-6">{turn.text}</p>
        {turn.intent === 'book' && (
          <div className="mt-3">
            <Button type="button" size="sm" onClick={onBook}>
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Choose time
            </Button>
          </div>
        )}
        {turn.intent === 'practice' && (
          <div className="mt-4 rounded-lg border border-[hsl(31_18%_78%)] bg-[hsl(47_31%_96%)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[hsl(352_59%_35%)]">
                  Question 1 of 3
                </p>
                <p className="mt-2 text-sm font-semibold">Solve: 2x + 5 = 17</p>
              </div>
              <BookOpenCheck className="h-5 w-5 text-[hsl(352_59%_35%)]" aria-hidden="true" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {['x = 5', 'x = 6', 'x = 7', 'x = 11'].map((answer) => (
                <button
                  key={answer}
                  type="button"
                  className="rounded-md border border-[hsl(31_18%_78%)] bg-[hsl(38_45%_99%)] px-3 py-2 text-left text-sm font-medium transition hover:border-[hsl(352_59%_35%_/_0.45)]"
                  onClick={onPractice}
                >
                  {answer}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TutorBookingDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-[hsl(31_18%_78%)] bg-[hsl(38_45%_99%)]">
        <DialogHeader>
          <DialogTitle>Book a tutor inside the conversation</DialogTitle>
          <DialogDescription>
            The assistant has already filled the likely context. Adjust the details before confirming.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Subject
            <Input defaultValue="Mathematics" />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Time
            <Input defaultValue="Today, 17:30" />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            What should the tutor know?
            <Textarea
              defaultValue="I need help with linear equations from my worksheet. I understand moving terms, but I get stuck when both sides have x."
              className="min-h-28"
            />
          </label>
        </div>
        <div className="rounded-lg border border-[hsl(31_18%_78%)] bg-[hsl(47_31%_96%)] p-4">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-[hsl(352_59%_35%)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Anna Keller is available</p>
              <p className="text-sm text-[hsl(24_8%_39%)]">Mathematics and physics tutor, 30-minute session.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function detectIntent(value: string): AssistantIntent {
  const lower = value.toLowerCase()
  if (lower.includes('book') || lower.includes('tutor') || lower.includes('teacher') || lower.includes('预约')) return 'book'
  if (lower.includes('upload') || lower.includes('photo') || lower.includes('homework') || lower.includes('上传')) return 'upload'
  if (lower.includes('mistake') || lower.includes('review') || lower.includes('错题')) return 'review'
  if (lower.includes('practice') || lower.includes('练习')) return 'practice'
  return 'explain'
}

function responseForIntent(intent: AssistantIntent) {
  if (intent === 'book') return 'I can schedule that here. I found an available tutor and prepared the session context.'
  if (intent === 'upload') return 'Upload the worksheet or take a photo, then I will turn it into a step-by-step explanation.'
  if (intent === 'review') return 'Here are the mistakes with the highest value to review today. We can start with equations.'
  if (intent === 'practice') return 'I prepared a short adaptive set. Answer one question at a time and I will adjust the next step.'
  return 'Send the question or describe the confusing step. I will explain it first, then offer practice or tutor help if needed.'
}
