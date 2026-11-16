/**
 * The content security policy the app is served with (#533).
 *
 * CloudFront sends it (stoa-infra, FrontendStack), first as
 * `Content-Security-Policy-Report-Only`; this file is the policy itself, and
 * the infra copy must equal `contentSecurityPolicy(PRODUCTION_SOURCES)`. The
 * dist e2e serves every page under it, enforced, and fails on any violation;
 * the smoke checks that production sends it.
 *
 * What each source is for:
 * - script-src 'self': the build has no inline script and loads nothing from
 *   elsewhere; KaTeX comes in as a chunk of our own.
 * - style-src 'unsafe-inline': KaTeX's markup carries style attributes and is
 *   set as HTML; sonner and Radix's dialogs put `<style>` elements in at run
 *   time. Styles cannot run code; scripts stay strict.
 * - font-src data:: KaTeX's smallest fonts are inlined into its stylesheet by
 *   the build (under Vite's 4 KB asset limit).
 * - img-src data: blob:: a picture is fetched with the token and shown from an
 *   object URL (attachments, a teacher's pictures, the moderation case, the
 *   phone upload's preview).
 * - connect-src: the API, its WebSocket for notifications, and the images
 *   bucket that an upload's parts are PUT to straight from the browser (#530).
 * - worker-src blob:: heic-to decodes a HEIC photo in a worker it starts from
 *   a blob URL; its `csp` build is the one that needs no `unsafe-eval`.
 * - frame-ancestors 'none': nobody frames the app.
 * - frame-src: the virtual classroom's shared whiteboard (#696, WBO), framed
 *   from its own host; nothing else is framed.
 * - Daily, the classroom's voice (#696): its call object loads its bundle by a
 *   <script> (`avoidEval`, so no 'unsafe-eval') and talks to Daily over HTTPS
 *   and WebSockets, from `*.daily.co` and the fallback domains Daily's CSP
 *   guide lists with it (docs.daily.co, "Setting up your CSP for daily-js");
 *   `*.daily.co` alone would block its failover. No blur or noise
 *   cancellation is used, so no 'wasm-unsafe-eval', blob: script or Banuba.
 */

import { URL } from 'node:url'

/** @typedef {{ apiOrigin: string, uploadOrigin: string, whiteboardOrigin: string }} PolicySources */

/** Where Daily's call bundle is loaded from (`script-src`). */
export const DAILY_SCRIPT_SOURCES = Object.freeze([
  'https://*.daily.co',
  'https://*.dailywebrtc.com',
  'https://*.dailywebrtc.net',
])

/** What Daily's call object connects to (`connect-src`): the narrowed list of its guide. */
export const DAILY_CONNECT_SOURCES = Object.freeze([
  'https://*.daily.co',
  'https://*.dailywebrtc.com',
  'https://*.dailywebrtc.net',
  'https://prod-ks.pluot.blue',
  'wss://*.daily.co',
  'wss://*.dailywebrtc.com',
  'wss://*.dailywebrtc.net',
])

/** @type {Readonly<PolicySources>} */
export const PRODUCTION_SOURCES = Object.freeze({
  apiOrigin: 'https://api.stoaedu.ch',
  // StoaStorageStack's images bucket, `stoa-images-<account>`, at the regional
  // host the backend signs part URLs for (virtual-hosted, eu-central-2).
  uploadOrigin: 'https://stoa-images-562923011260.s3.eu-central-2.amazonaws.com',
  // The WBO board behind a named Cloudflare tunnel (#696, stoa-backend#467's
  // WBO_BASE_URL); its address is fixed so the policy can name it.
  whiteboardOrigin: 'https://board.stoaedu.ch',
})

/**
 * The policy as one header value.
 *
 * @param {PolicySources} sources
 * @returns {string}
 */
export function contentSecurityPolicy({ apiOrigin, uploadOrigin, whiteboardOrigin }) {
  const api = new URL(apiOrigin)
  const realtime = `wss://${api.host}`
  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", ...DAILY_SCRIPT_SOURCES],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", 'data:', 'blob:'],
    ["font-src", "'self'", 'data:'],
    ["connect-src", "'self'", api.origin, realtime, new URL(uploadOrigin).origin, ...DAILY_CONNECT_SOURCES],
    ["frame-src", new URL(whiteboardOrigin).origin],
    ["worker-src", "'self'", 'blob:'],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ]
  return directives.map((directive) => directive.join(' ')).join('; ')
}
