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
  to that schema. Any other 4xx is held to FastAPI's `{ detail }` envelope only.
- The star map still reads fixture data, so the knowledge-map read model is
  not exercised; when #48 connects it, its mock must be added here.
- Chromium on a desktop viewport only. No real Cognito, Bedrock or SES.
