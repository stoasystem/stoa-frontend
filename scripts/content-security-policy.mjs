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
 */

import { URL } from 'node:url'

/** @typedef {{ apiOrigin: string, uploadOrigin: string }} PolicySources */

/** @type {Readonly<PolicySources>} */
export const PRODUCTION_SOURCES = Object.freeze({
  apiOrigin: 'https://api.stoaedu.ch',
  // StoaStorageStack's images bucket, `stoa-images-<account>`, at the regional
  // host the backend signs part URLs for (virtual-hosted, eu-central-2).
  uploadOrigin: 'https://stoa-images-562923011260.s3.eu-central-2.amazonaws.com',
})

/**
 * The policy as one header value.
 *
 * @param {PolicySources} sources
 * @returns {string}
 */
export function contentSecurityPolicy({ apiOrigin, uploadOrigin }) {
  const api = new URL(apiOrigin)
  const realtime = `wss://${api.host}`
  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'"],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", 'data:', 'blob:'],
    ["font-src", "'self'", 'data:'],
    ["connect-src", "'self'", api.origin, realtime, new URL(uploadOrigin).origin],
    ["worker-src", "'self'", 'blob:'],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ]
  return directives.map((directive) => directive.join(' ')).join('; ')
}
