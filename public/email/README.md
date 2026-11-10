# public/email/ — images linked from emails

The backend's emails (stoasystem/stoa-backend#374) link to the files here by their
full URL. The default for `email_logo_url` in stoa-backend `src/stoa/config.py` is:

    https://app.stoaedu.ch/email/stoa-logo.png

Every email already sent points at that address, and mail clients (and Gmail's image
proxy) fetch it whenever someone opens one. So:

- **Never move, rename or delete these files**, not even in a redesign. You may
  replace the bytes in place: the publisher caches `email/*` for a week, not forever.
- A missing file does not 404. CloudFront's SPA fallback answers any unknown path
  with `index.html` and status 200, so a broken link shows up as `text/html`. After
  any change, check:

      curl -I https://app.stoaedu.ch/email/stoa-logo.png

  and expect `200` with `Content-Type: image/png`.

`stoa-logo.png` is the colour logo from the website (`stoaedu.ch/img/logo/logo2.png`),
359×195 PNG. This README is not uploaded (`SKIP_NAMES` in
`scripts/publish-web-release.mjs`). Ticket: #624.
