/**
 * #25 (card 033 [A-15]): every address written out in a page or component
 * leads somewhere.
 *
 * routeManifestConsistency.test.ts checks the manifest's own navigation and
 * redirects. A `<Link to="/...">` written into a page never passes through the
 * manifest, so a link to a route nobody registered opens the 404 page and no
 * test notices: the parent's "Monthly report" button did exactly that.
 *
 * This scans the source for literal `to="/..."` props and `to: '/...'` fields
 * (template literals included, with `${...}` filled by a sample value) and
 * matches each address against the registered pages and legacy redirects with
 * react-router's own `matchRoutes`. Addresses built at run time are not seen.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { matchRoutes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { legacyRedirects, pageRoutes } from '@/app/router/routeManifest'

const SRC = path.resolve(__dirname, '../../src')
const SCANNED = ['pages', 'components', 'features']

/*
 * Files kept on disk while their routes are withdrawn from the manifest, so
 * their links point at pages that are switched off rather than missing. Card
 * 007 froze billing (see the note above `pageRoutes` in routeManifest.ts); no
 * reachable page renders these. accountMenuTargets.ts keeps the parent's
 * /billing item and drops it at run time while no page answers it
 * (`isRegisteredPage`). The list may only shrink: a file that no longer holds a
 * dead link must be taken off it.
 */
const FROZEN_FILES = [
  'components/billing/LockedFeatureCard.tsx',
  'components/billing/ManageBillingButton.tsx',
  'components/billing/PaymentMethodReminderBanner.tsx',
  'components/parent/ParentSubscriptionOperationsCard.tsx',
  'components/parent/UpgradePromptCard.tsx',
  'components/shell/accountMenuTargets.ts',
  'pages/billing/CheckoutResultPage.tsx',
  'pages/billing/PaymentSettingsPage.tsx',
  'pages/billing/VirtualCheckoutPage.tsx',
]

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

/** Blank out comments, keeping line numbers, so commented-out links are not read. */
function withoutComments(source: string): string {
  const blank = (text: string) => text.replace(/[^\n]/g, ' ')
  return source.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/^[ \t]*\/\/.*$/gm, blank)
}

const LITERAL_TARGET = /\bto(?:=|:\s*)(?:\{\s*)?(?:"(\/[^"]*)"|'(\/[^']*)'|`(\/[^`]*)`)/g

/** Every literal address in `source`, with the line it is on. */
function literalTargets(source: string): { line: number; address: string }[] {
  const code = withoutComments(source)
  return [...code.matchAll(LITERAL_TARGET)].map((match) => ({
    line: code.slice(0, match.index).split('\n').length,
    address: match[1] ?? match[2] ?? match[3],
  }))
}

const registered = [...pageRoutes.map((route) => route.path), ...legacyRedirects.map((redirect) => redirect.from)]
  .filter((pattern) => pattern !== '*')
  .map((pattern) => ({ path: pattern }))

/** Whether an address, with `${...}` filled in and query and hash dropped, opens a registered route. */
function resolves(address: string): boolean {
  const pathname = address.replace(/\$\{[^}]*\}/g, 'sample').split(/[?#]/)[0]
  return matchRoutes(registered, pathname) !== null
}

function deadLinks(): { file: string; at: string }[] {
  return SCANNED.flatMap((dir) => sourceFiles(path.join(SRC, dir))).flatMap((full) => {
    const file = path.relative(SRC, full).split(path.sep).join('/')
    return literalTargets(readFileSync(full, 'utf8'))
      .filter(({ address }) => !resolves(address))
      .map(({ line, address }) => ({ file, at: `src/${file}:${line} ${address}` }))
  })
}

describe('#25: literal link targets in pages and components', () => {
  const dead = deadLinks()

  it('leads every literal address to a registered page or redirect', () => {
    expect(dead.filter(({ file }) => !FROZEN_FILES.includes(file)).map(({ at }) => at)).toEqual([])
  })

  it('exempts only frozen files that still hold a dead link', () => {
    const stillDead = new Set(dead.map(({ file }) => file))
    expect(FROZEN_FILES.filter((file) => !stillDead.has(file))).toEqual([])
  })
})

describe('#25: the scan itself', () => {
  it.each([
    ['<Link to="/does-not-exist">x</Link>', '/does-not-exist'],
    ["<Link to={'/does-not-exist'}>x</Link>", '/does-not-exist'],
    ['<Link to={`/parent/children/${id}/monthly-report`}>x</Link>', '/parent/children/${id}/monthly-report'],
    ["items={[{ label: 'x', to: '/does-not-exist' }]}", '/does-not-exist'],
  ])('finds and refuses the address in %s', (source, address) => {
    expect(literalTargets(source).map((target) => target.address)).toEqual([address])
    expect(resolves(address)).toBe(false)
  })

  it.each([
    ['<Link to="/parent/reports">x</Link>'],
    ['<Link to={`/parent/children/${id}/report`}>x</Link>'],
    ['<Link to="/me?tab=profile#top">x</Link>'],
    ['<Link to="/assistant">x</Link>'],
  ])('accepts the registered address in %s', (source) => {
    const [target] = literalTargets(source)
    expect(resolves(target.address)).toBe(true)
  })

  it('skips commented-out links and keeps line numbers', () => {
    const source = ['{/*', '  <Link to="/gone">x</Link>', '*/}', '// <Link to="/gone">', '<Link to="/also-gone">x</Link>'].join('\n')
    expect(literalTargets(source)).toEqual([{ line: 5, address: '/also-gone' }])
  })
})
