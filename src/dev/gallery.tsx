/*
 * The base components and the shell, laid out like the canvas boards
 * Components and Sizes, for looking at side by side with them (#18). Dev
 * server only: open /src/dev/components.html. `?view=shell` shows the app shell
 * on a light page, `?view=sky` over the sky; `&role=` picks the account.
 *
 * Not a product screen, so its words are not translated.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Bell, BookOpen, Globe, Lightbulb, Plus, UserRound, X } from 'lucide-react'
import { StrictMode, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerDevelopmentRuntimeConfig } from '@/lib/runtimeConfig'
import type { UserRole } from '@/types/user'

registerDevelopmentRuntimeConfig('http://localhost:8000', window.location.origin)

const params = new URLSearchParams(window.location.search)
const view = params.get('view') ?? 'components'
const role = (params.get('role') ?? 'student') as UserRole

async function start() {
  await Promise.all([import('../index.css'), import('@/i18n')])
  const base = await import('@/components/base')
  const { AppLayout } = await import('@/layouts/AppLayout')
  const { useAuthStore } = await import('@/store/authStore')
  const { Avatar, Button, Composer, Group, IconButton, Pill, PresenceDot, Progress, Row, SearchField, SegmentedFilter, SegmentedNav, Toggle } = base

  useAuthStore.setState({
    user: { id: 'dev', name: 'Lina Meier', email: 'lina@example.test', role } as never,
    accessToken: null,
    isAuthenticated: true,
  })

  function Section({ title, children, note }: { title: string; note?: string; children: ReactNode }) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 text-[17px] font-semibold text-ink">{title}</h2>
          {note && <p className="m-0 text-[13px] text-caption">{note}</p>}
        </div>
        {children}
      </section>
    )
  }

  function Sky({ children }: { children: ReactNode }) {
    return (
      <div data-surface="sky" className="flex flex-wrap items-center gap-3 rounded-[12px] bg-sky p-4 text-on-sky">
        {children}
      </div>
    )
  }

  function ComposerDemo({ variant }: { variant: 'docked' | 'full' }) {
    const [value, setValue] = useState('')
    return (
      <Composer
        variant={variant}
        label="Ask"
        placeholder={variant === 'docked' ? 'Ask about anything on the planet…' : 'Ask anything about your schoolwork…'}
        value={value}
        onChange={setValue}
        onSubmit={() => setValue('')}
        onAttach={() => {}}
        footerStart={
          variant === 'full' ? (
            <button type="button" className="h-8 rounded-full border-0 bg-transparent px-3 text-[14px] font-medium text-caption">
              Mathematics ▾
            </button>
          ) : undefined
        }
      />
    )
  }

  function Components() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'progress' | 'resolved'>('all')
    const [notify, setNotify] = useState(true)
    const [off, setOff] = useState(false)

    return (
      <div className="min-h-screen bg-ground px-4 py-8 text-ink sm:px-12">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 border-b border-separator pb-3.5">
          <span className="text-[12px] font-semibold tracking-[0.6px] text-caption uppercase">STOA design language</span>
          <h1 className="m-0 text-[26px] font-bold tracking-[-0.5px]">Base components</h1>
        </div>
        <div className="mx-auto mt-6 grid max-w-[1180px] gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <Section title="Buttons" note="Large 50 · Regular 40 · Small 32. Filled, tinted, plain, gray.">
              {(['large', 'regular', 'small'] as const).map((size) => (
                <div key={size} className="flex flex-wrap items-center gap-3">
                  <Button size={size}>Resume</Button>
                  <Button size={size} variant="tinted">Ask a teacher</Button>
                  <Button size={size} variant="plain">Skip</Button>
                  <Button size={size} variant="gray">Cancel</Button>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <Button size="large" style={{ minWidth: 200 }}>Check answer</Button>
                <Button variant="plain">
                  <Lightbulb size={18} strokeWidth={1.6} aria-hidden="true" /> Hint
                </Button>
                <Button disabled>Disabled</Button>
              </div>
              <Sky>
                <Button variant="onSky">Continue</Button>
                <Button variant="onSkyPlain">Skip</Button>
              </Sky>
            </Section>
            <Section title="Icon buttons" note="24/14 · 28/16 · 30/18 · 32/20 · 34/20 · 36/22">
              <div className="flex flex-wrap items-center gap-3">
                {([24, 28, 30, 32, 34, 36] as const).map((size) => (
                  <IconButton key={size} label={`Add (${size})`} icon={Plus} size={size} variant="tinted" />
                ))}
                <IconButton label="Notifications" icon={Bell} />
                <IconButton label="Close" icon={X} variant="gray" />
                <IconButton label="Send" icon={Plus} size={32} glyph={18} variant="filled" />
              </div>
            </Section>
            <Section title="Avatars" note="16 · 26 · 28 · 30 · 36 · 44 · 60">
              <div className="flex flex-wrap items-center gap-3">
                {([16, 26, 28, 30, 36, 44, 60] as const).map((size) => (
                  <Avatar key={size} name="Lina Meier" size={size} />
                ))}
                <Avatar name="Noah Keller" size={36} tone="neutral" />
                <Avatar name="Sofia Rossi" size={36} tone="green" />
              </div>
            </Section>
            <Section title="Segmented" note="Navigation 30 · filters 28">
              <div className="flex justify-start">
                <SegmentedNav
                  label="Teacher"
                  activeIndex={0}
                  items={[
                    { to: '/src/dev/components.html', label: 'Requests' },
                    { to: '/src/dev/components.html?availability', label: 'Availability' },
                  ]}
                />
              </div>
              <SegmentedFilter
                label="Status"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'progress', label: 'In progress' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            </Section>
            <Section title="Search field" note="32 toolbar · 36 default · 38 page">
              <SearchField label="Search" size="toolbar" placeholder="Search students" style={{ width: 220 }} />
              <SearchField label="Search" placeholder="Search topics, skills, or questions" />
              <SearchField label="Search" size="page" placeholder="Search the library" />
            </Section>
          </div>
          <div className="flex flex-col gap-8">
            <Section title="Grouped list" note="Rows 52 · 48 settings · 56 with subtitle · 64 with avatar">
              <Group title="Subjects">
                <Row
                  title="Mathematics"
                  subtitle="14 topics · 62% complete"
                  leading={{ kind: 'icon', icon: BookOpen, tone: 'accent' }}
                  trailing={<Progress label="Mathematics" value={62} width={96} />}
                  to="/src/dev/components.html"
                />
                <Row title="App language" compact leading={{ kind: 'icon', icon: Globe }} trailing="English" to="/src/dev/components.html" />
                <Row
                  title="Notifications"
                  compact
                  leading={{ kind: 'icon', icon: Bell }}
                  trailing={<Toggle label="Notifications" checked={notify} onCheckedChange={setNotify} />}
                />
                <Row
                  title="Lina Meier"
                  subtitle="Mathematics · Grade 8 — Which case do I use after “mit”?"
                  leading={{ kind: 'avatar', name: 'Lina Meier' }}
                  trailing={
                    <span className="flex items-center gap-3">
                      <span className="text-[13px]">12 min ago</span>
                      <Pill>Pending</Pill>
                    </span>
                  }
                  to="/src/dev/components.html"
                />
              </Group>
              <Group>
                <Row title="Profile" leading={{ kind: 'icon', icon: UserRound }} to="/src/dev/components.html" />
              </Group>
            </Section>
            <Section title="Status" note="Tinted pills 22 · presence dot 8">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="accent">Pending</Pill>
                <Pill tone="gold">Assigned</Pill>
                <Pill tone="green">In progress</Pill>
                <Pill tone="neutral">Resolved</Pill>
                <Pill tone="green">Ready</Pill>
                <span className="ml-3 inline-flex items-center gap-2 text-[13px] text-caption">
                  <PresenceDot /> 2 teachers online
                </span>
              </div>
            </Section>
            <Section title="Toggle and progress" note="Toggle 26 × 44 · progress 4">
              <div className="flex items-center gap-4">
                <Toggle label="On" checked={notify} onCheckedChange={setNotify} />
                <Toggle label="Off" checked={off} onCheckedChange={setOff} />
                <Progress label="Progress" value={38} width={200} />
              </div>
            </Section>
            <Section title="Composer" note="Docked 46 · full ~150">
              <ComposerDemo variant="docked" />
              <div data-surface="sky" className="rounded-[12px] bg-sky px-3 py-2.5">
                <ComposerDemo variant="docked" />
              </div>
              <ComposerDemo variant="full" />
            </Section>
          </div>
        </div>
      </div>
    )
  }

  function ShellPage({ sky }: { sky: boolean }) {
    return (
      <AppLayout surface={sky ? 'sky' : 'light'}>
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1
              className="m-0"
              style={{ font: 'var(--t-large)', letterSpacing: 'var(--t-large-tracking)', color: sky ? 'var(--on-sky-text)' : undefined }}
            >
              {sky ? 'Linear equations' : 'Requests'}
            </h1>
            <p className="m-0 text-[17px]" style={{ color: sky ? 'var(--on-sky-text-body)' : 'var(--secondary)' }}>
              {sky ? '4 of 10 questions · about 6 min left' : 'Student questions where teacher guidance can help.'}
            </p>
          </div>
          {sky ? (
            <div className="flex flex-col gap-4">
              <div
                className="flex flex-col gap-3 p-4"
                style={{
                  background: 'var(--sky-glass)',
                  border: '1px solid var(--sky-glass-border)',
                  borderRadius: 'var(--corner-card)',
                  backdropFilter: 'blur(var(--sky-glass-blur))',
                  boxShadow: 'var(--shadow-glass)',
                }}
              >
                <span style={{ font: 'var(--t-title1)', color: 'var(--lit)' }}>3 lit</span>
                <span style={{ color: 'var(--on-sky-text-caption)' }}>Algebra · 2 in progress</span>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="onSky" size="large">Continue</Button>
                  <Button variant="onSkyPlain">Not now</Button>
                </div>
              </div>
              <div className="mx-auto w-full max-w-[640px]">
                <ComposerDemo variant="docked" />
              </div>
            </div>
          ) : (
            <Group>
              <Row title="Lina Meier" subtitle="Mathematics · Grade 8" leading={{ kind: 'avatar', name: 'Lina Meier' }} trailing={<Pill>Pending</Pill>} to="/src/dev/components.html" />
              <Row title="Noah Keller" subtitle="German · Grade 7" leading={{ kind: 'avatar', name: 'Noah Keller' }} trailing={<Pill tone="gold">Assigned</Pill>} to="/src/dev/components.html" />
              <Row title="Mia Huber" subtitle="Mathematics · Grade 6" leading={{ kind: 'avatar', name: 'Mia Huber' }} trailing={<Pill tone="neutral">Resolved</Pill>} to="/src/dev/components.html" />
            </Group>
          )}
        </div>
      </AppLayout>
    )
  }

  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrowserRouter>
          {view === 'components' ? <Components /> : <ShellPage sky={view === 'sky'} />}
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void start()
