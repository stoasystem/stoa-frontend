# Demo Known Limitations

## Product Limitations

- The local demo backend is not the production backend.
- SQLite is local demo/test infrastructure only.
- Payment flows are virtual or hosted-checkout-ready concepts, not real payment collection.
- Teacher verification and credential upload are demo-only.
- Learning-intelligence surfaces are demonstrations, not real diagnosis or curriculum computation.
- Legal, privacy, and native-speaker review are not final approval.

## QA Limitations

- Chromium automation exists; Safari, Firefox, Edge, Mobile Safari, and Android Chrome still require manual pass before launch candidate approval.
- Screen-reader smoke testing still requires manual VoiceOver or NVDA validation.
- Visual regression strategy is documented, but committed PNG baselines are optional unless the team decides otherwise.

## Demo Limitations

- Reset must be run before formal demos.
- Previous demo interactions may temporarily alter conversations, tickets, or request statuses.
- Some advanced pages are suitable for internal review only and should not be shown in formal demos.
- Admin routes demonstrate operational visibility, not production operations.

