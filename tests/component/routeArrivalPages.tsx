/* Stands in for `@/app/router/lazyPage` in routeArrival406.test.tsx. Each page
 * is drawn in the real app shell, so moving to another page replaces the top
 * bar and its navigation as in the app, with a heading that names the export it
 * would have loaded and a few links of its own. Some pages differ the way real
 * ones do: one has no heading, one puts focus on its own field, the map keeps
 * one page across its paths. Kept apart from the test, which imports the
 * router that imports this.
 *
 * The layouts import the route manifest, which imports this module while it
 * is being mocked: a static import here would wait on itself. They are loaded
 * apart instead, and the test waits for `shellReady` before it renders. */
import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import type { AppSurface } from '@/layouts/AppLayout'

type Shell = {
  AppLayout: (props: { children: ReactNode; surface?: AppSurface; bleed?: boolean }) => ReactNode
  DashboardLayout: (props: { children: ReactNode }) => ReactNode
}

let shell: Shell | null = null

export const shellReady = Promise.all([import('@/layouts/AppLayout'), import('@/layouts/DashboardLayout')]).then(
  ([app, dashboard]) => {
    shell = { AppLayout: app.AppLayout, DashboardLayout: dashboard.DashboardLayout }
  },
)

function loaded(): Shell {
  if (!shell) throw new Error('await shellReady before rendering a stub page')
  return shell
}

function AppLayout(props: Parameters<Shell['AppLayout']>[0]) {
  const Layout = loaded().AppLayout
  return <Layout {...props} />
}

function DashboardLayout(props: Parameters<Shell['DashboardLayout']>[0]) {
  const Layout = loaded().DashboardLayout
  return <Layout {...props} />
}

function PageLinks() {
  const navigate = useNavigate()
  return (
    <>
      <Link to="/teacher/profile">Profile</Link>
      <Link to="/teacher/requests/r-1">Request one</Link>
      <Link to="/teacher/requests/r-2">Request two</Link>
      <Link to="/tutor/availability">Old availability address</Link>
      <Link to="/teacher">Teacher home</Link>
      <Link to="/map/s1">Star map</Link>
      <Link to="/me">My account</Link>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
    </>
  )
}

/** Puts focus on its own field once it is shown, the way Ask's composer does. */
function FocusedField() {
  const field = useRef<HTMLInputElement>(null)
  useEffect(() => field.current?.focus(), [])
  return <input ref={field} aria-label="The page's own field" />
}

/** One page for every map path, as in the app; choosing the nebula takes its link away. */
function MapStub({ pageName }: { pageName: string }) {
  const { topicId } = useParams()
  return (
    <AppLayout bleed surface="sky">
      <h1>{pageName}</h1>
      {!topicId && <Link to="/map/s1/t1">A nebula</Link>}
      <Link to="/me">My account</Link>
    </AppLayout>
  )
}

function Page({ pageName }: { pageName: string }) {
  switch (pageName) {
    case 'TeacherAvailabilityPage':
      return (
        <DashboardLayout>
          <p>A page without a heading.</p>
          <PageLinks />
        </DashboardLayout>
      )
    case 'TeacherProfilePage':
      return (
        <DashboardLayout>
          <PageHeader title={pageName} />
          <FocusedField />
        </DashboardLayout>
      )
    case 'MapPage':
      return <MapStub pageName={pageName} />
    default:
      return (
        <DashboardLayout>
          <PageHeader title={pageName} />
          <PageLinks />
        </DashboardLayout>
      )
  }
}

export function lazyPage(pageName: string) {
  return Object.assign(() => <Page pageName={pageName} />, { pageName })
}

/* Stub pages never fail to load, so there is nothing to try again. */
export function retryFailedPageLoads() {}
