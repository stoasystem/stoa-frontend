# Not a suite

The end-to-end suite that lived here was removed on 2026-09-23 (card 024): it
ran against a local dev server and a demo mode the application no longer has,
and could not pass. Signed-in coverage is `tests/smoke/`, which signs in to a
real deployment.

One file stayed, and it is not a test anybody runs from here.

`billing-paid-access.spec.ts` is one of three sources the Phase 476 sandbox
evidence chain digests — with `scripts/stripe-sandbox-preflight.mjs` and
`stoa-backend/scripts/capture_phase476_sandbox_evidence.py` — to record that a
real Stripe sandbox checkout was once driven through a browser. Payments are
frozen (card 007), so nothing runs it; deleting it would break the chain that
has to be re-read the day payments are unfrozen.

It was deleted with the rest of the suite and put back: the reference that
needed it lives in the *backend* repository, and only this repository was
searched.
