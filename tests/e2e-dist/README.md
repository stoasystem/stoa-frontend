# dist e2e

Playwright against the built `dist/`, with the backend mocked. It runs in the
redesign gate after `npm run build` ([#29](https://github.com/stoasystem/stoa-frontend/issues/29)).

```bash
npm run build
npm run test:e2e:dist
```

## How it works

- **The site.** `support/global-setup.ts` copies `dist/` to `.e2e-dist/site` and
  publishes the copy with the real `scripts/publish-web-release.mjs`; only the
  AWS CLI is stood in for. So `runtime-config.json` and `served-release.json`
  are made by the same code as in production, and the app's startup checks run
  against them unchanged. The site is served at `https://app.stoa-e2e.test`
  inside the browser (`support/site.ts`); the host is https and not
  `localhost` / `staging` / `pilot`, because a production release refuses those.
- **The backend.** Requests to `https://api.stoa-e2e.test` are answered by
  `support/backend.ts`. Each one is first matched to an operation in the
  backend's OpenAPI document; the request body and the mock's reply are both
  checked against it, and an object may carry only the properties its schema
  names; required query parameters must be there and undeclared ones may not.
  A request to an operation the document does not have, or one no mock
  answers, is a problem too. The fixture fails the test if there are any.
- **Nothing else.** A request to any other host, or a WebSocket, is refused and
  is a problem; so is a file the site does not have (a 404, as on the CDN,
  instead of index.html). A broken build or a call that would carry the token
  somewhere else cannot pass unseen.
- **The contract.** The OpenAPI document comes from stoa-backend main
  (`docs/api/openapi.json`, [stoa-backend#80](https://github.com/stoasystem/stoa-backend/issues/80)),
  read live like the route inventory. To run against a local export instead:

  ```bash
  cd <stoa-backend>
  PYTHONPATH=src python -c "import json; from stoa.main import app; print(json.dumps(app.openapi()))" > /tmp/openapi.json
  STOA_OPENAPI_PATH=/tmp/openapi.json npm run test:e2e:dist
  ```

  On Windows the import also needs `pip install tzdata` (no system time zones).

## What it covers

`student.spec.ts`: a student signs in and lands on the star map, and stays
signed in across a reload; asks a question, gets the answer, and a reload in
the middle of the next answer picks it up again without sending the question
twice; signs out, which clears the session here and calls `POST /auth/logout`.

`firstScreen.spec.ts`: after a student's reload, the star map's code is asked
for, once, while `/auth/me` is still being answered rather than after it, and
the map follows the account without the page skeleton in between (#415); a
teacher's home does the same, and an administrator's page brings the
administrators' copy along (#456). A page's code refused after a reload (the
teacher's while loaded ahead, before the account) reloads the tab once, and
the document that reload opens waits for the account before asking again.

`chunkFailure.spec.ts`: a page or KaTeX file that cannot be fetched, with
Vite's real preload helper and Chromium's module map. A page reloads the tab
once and, failing again, offers only "Reload page"; KaTeX never reloads it and
is asked for again under a new address; a page that fails after the reader went
back reloads nothing, and offline it waits for the connection; a stylesheet
that failed is put back before the next page that loads is shown, and failing
again holds back no page that never failed on it (#272, #401, #447).

`attachments.spec.ts`: a photo chosen in Ask is shrunk to a JPEG in the
browser, goes up by intent, part URL, a PUT straight to S3 (answered in
`support/uploads.ts`, which refuses a part whose SHA-256 is not the one signed
for) and `complete`, and the question carries it as `{ uploadId }`; a picture
image moderation refuses (`422 upload_content_blocked`, stoa-backend#138) is
said to be refused in the tray, and the question goes out without it (#512).
While `ATTACHMENTS_WORK` is off the file goes into the chooser input directly
and the test checks the button is absent; once it is on, the test opens the
chooser from the button.

`phoneUpload.spec.ts`: a photo from the phone by QR (#514). The phone's page,
not signed in, takes the code from after the `#` and out of the address, spends
it once on `redeem`, and sends the part to S3 and `complete` with the upload
token only; no request carries the code or a session. An expired or used code
(`404 upload_code_invalid`) is said, and nothing is sent. In Ask the button waits
behind `ATTACHMENTS_WORK` like the paperclip: while it is off the test checks it
is absent; once it is on, the QR is checked to encode the phone page's address
with the code after the `#`, a second, signed-out browser sends the photo, and
the computer shows it and adds it only when the student says so.

`teacherReplyImages.spec.ts`: a teacher's picture goes up the same way, as
`help_reply_image`, and the reply carries it as `{ uploadId }`; the student
sees it in Ask as a thumbnail the browser drew, read with their own token from
`/files/attachments/{id}/content` (#513, stoa-backend#145). The button waits
for the same switch, and the test handles it as `attachments.spec.ts` does.
`MockBackend` answers a file's bytes with `raw`.

`moderationImage.spec.ts`: an administrator opens an `image_upload` case in the
moderation queue (#538, stoa-backend#139). The image moderation refused is read
with the administrator's token from `/admin/moderation/cases/{id}/image`, drawn
from an object URL and blurred until "Show image"; the case names what it was
blocked for. A deleted image is said to be deleted, and not asked for.

`forcedChange.spec.ts`: a student whose password an administrator reset opens
`/ask`, signs in, is sent to the password change with only Help and Log out in
the shell, reloads it, changes the password, and "Continue" opens `/ask`; the
backend is asked for nothing it would refuse during the reset but the sky (#412).

`accountMenu.spec.ts`: at 375 px, the account menu's language and switch-account
lists open on the screen and can be tapped where they are drawn (#162: they
opened at x = -152).

`pageChange.spec.ts`: a page opened from the foot of a long one starts at its
top, with its heading focused under the sticky bar, and Back from it (a long
page too) gives the first one back where it was read; the star map, a
full-height page, opens with its bar and heading on the screen (a check: the
browser already puts such a page at the top, on a desktop); the sign-in page
at `/` names itself in the tab and is announced on arriving from another page
(#448).

`controls.spec.ts` holds two controls. One is a negative control marked
`test.fail()`: it fails while the app renders, and passes -- turning the suite
red -- if it stops rendering. The other sends a reply that breaks the contract
and asserts the exact problem the check reports.

No retries. A test that needs one is a finding.

## What it cannot catch

- **The mocks are ours.** The contract check proves a mock describes fields
  and types the backend declares, not that the backend behaves that way (order
  of calls, status on a given input, timing).
- **Untyped operations are not checked.** An operation whose OpenAPI schema is
  empty accepts anything. None of the operations mocked here is untyped since
  [stoa-backend#81](https://github.com/stoasystem/stoa-backend/issues/81) gave
  `GET /adaptive/students/me/memory` its model; the open parts inside it
  (`memorySnapshots`, `strengthTopics`, extra keys in list items) accept anything.
- **Path parameters are not validated**, only matched; query parameters are
  checked for presence, not for their values.
- **Error replies are checked only where the backend declares them.** Since
  stoa-backend#81 the backend declares the 401 of every operation that takes a
  bearer token and of sign-in, refresh and sign-out, the 409 of the generation
  progress and the 404 of the teacher-help status; a mock's reply there is held
  to that schema. Any other 4xx is held to FastAPI's `{ detail }` envelope only,
  and so is a 422 the backend raises itself (`detail` an object, not the
  request-validation list the document declares for 422): an upload's
  `upload_content_blocked`, say. Which codes exist is asserted from the
  document's own enum where a test depends on one (`contract.enumOf`).
- The star map still reads fixture data, so the knowledge-map read model is
  not exercised; when #48 connects it, its mock must be added here.
- Chromium on a desktop viewport only. No real Cognito, Bedrock or SES.
