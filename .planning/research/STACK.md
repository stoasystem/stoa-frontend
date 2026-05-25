# Stack Research

**Domain:** STOA Phase 15 homepage, onboarding, and AI-first learning UI
**Researched:** 2026-05-25
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | Existing `^19.0.0` | UI composition | Keep the current app stack and avoid framework churn during a design refinement milestone. |
| TypeScript | Existing `^5.5.0` | Typed onboarding contracts and chat UI state | The new role-specific registration payloads need explicit types to keep service contracts and forms aligned. |
| Vite | Existing `^6.0.0` | Local development and build | Continue the current validated frontend workflow. |
| TailwindCSS | Existing project setup | Premium visual system and responsive layout | Token-driven utility classes are enough for the requested editorial layout, transitions, and mobile responsiveness. |
| TanStack Query | Existing `^5.40.0` | Register/upload/chat mutations | Reuse the existing server-state pattern rather than adding a form framework or new state layer. |
| Axios/fetch service wrappers | Existing | API calls | Keep the Phase 14 contract boundary: page components should call services/hooks, not raw URLs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Existing | Icons | Use for restrained navigation, onboarding steps, upload state, and inline teacher request actions. |
| CSS transitions | Native | Motion | Preferred for Phase 15; avoids adding framer-motion unless richer animation becomes necessary later. |
| Browser `File` API | Native | Tutor credential validation | Enough for extension and file-size validation before mock upload. |

## What Not To Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| framer-motion as a new dependency | The requested motion is subtle and can be handled with CSS transitions/keyframes. | Tailwind/CSS animation utilities. |
| A large form library | Existing forms are manageable and the flow is milestone-scoped. | Local typed React state with focused components. |
| Real credential verification/OCR | Out of scope and backend-owned. | Mock file upload contract and clear pending-review UI. |
| New design-system rewrite | Phase 16 is the right place for systematic component hardening. | Premium theme CSS and scoped component refinements. |

## Stack Patterns

**Homepage and auth UI**
- Add domain components under `src/components/home` and `src/components/auth`.
- Use premium theme CSS variables and existing Tailwind tokens.

**Onboarding API**
- Extend `POST /auth/register` payload shape.
- Add `POST /files/tutor-credentials` mock upload.

**Chat escalation**
- Keep existing chat APIs.
- Move teacher escalation presentation into message-level UI.

## Sources

- Appcues onboarding guide, 2026-05-19: onboarding should guide users to repeatable value, not act as a one-time product tour.
- Nielsen Norman Group mobile image guidance, 2023-11-08: mobile images should add informational value, not just decoration.
- Tavi AI education product page, accessed 2026-05-25: child-facing AI tutoring benefits from a clear product promise, parent-owned visibility, and constrained help behavior.
- arXiv 2605.11155, submitted 2026-05-11: hybrid human-AI tutoring can outperform AI-only tutoring and supports differentiating proactive/reactive human help based on student needs.

---
*Stack research for: STOA Phase 15*
*Researched: 2026-05-25*
