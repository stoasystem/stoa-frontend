# Architecture Research

**Domain:** STOA Phase 15 homepage, onboarding, and AI-first learning UI
**Researched:** 2026-05-25
**Confidence:** HIGH

## Standard Architecture

```
Homepage
  -> MarketingLayout navigation
  -> Home sections with premium theme CSS
  -> Start Learning route decision

Auth / Onboarding
  -> RegisterPage local wizard state
  -> Role-specific step components
  -> auth service register mutation
  -> route redirect by returned role/status

Tutor Credential Upload
  -> TutorCredentialUpload component
  -> file validation
  -> files service upload mutation
  -> mock uploaded file ids in tutor profile payload

Chat
  -> existing conversation/message hooks
  -> AI-first empty state
  -> assistant message feedback component
  -> existing teacher-help request mutation

Demo Backend
  -> /auth/register accepts profile payload
  -> /files/tutor-credentials accepts multipart mock file
  -> existing chat and teacher-help APIs remain canonical
```

## Recommended Project Structure

```
src/
  components/
    home/                 # Homepage editorial sections
    auth/                 # Registration wizard steps
    chat/                 # Inline AI feedback and teacher escalation
  pages/
    home/HomePage.tsx
    auth/RegisterPage.tsx
  services/
    files/tutorCredentialApi.ts
  hooks/
    files/useTutorCredentialUploadMutation.ts
  types/onboarding.ts
  styles/premium-theme.css
backend/
  app/main.py             # Demo register/upload support
```

## Architectural Patterns

### Pattern 1: Role-Specific Wizard State

**What:** Keep a single register flow with a shared account step and role-specific profile step.
**Why:** Avoids duplicate register pages while preserving role-specific requirements.
**Trade-off:** Local state is enough for demo; later production onboarding may need resumability.

### Pattern 2: Contract-First Service Wrappers

**What:** Register and credential upload go through typed service/hook modules.
**Why:** Preserves Phase 14's demo/real backend decoupling.
**Trade-off:** Slightly more files, but cleaner migration path.

### Pattern 3: Inline Escalation in Chat

**What:** Teacher help CTA renders near assistant output.
**Why:** Matches the AI-first product model and prevents homepage/module confusion.
**Trade-off:** Needs careful UI state to avoid duplicate requests.

## Data Flow

### Student Start Learning

```
Homepage CTA
  -> /login?next=/chat when unauthenticated
  -> /chat when student session exists
  -> role home when parent/tutor/admin session exists
```

### Registration

```
Choose role
  -> account details
  -> role profile
  -> optional tutor credential upload
  -> POST /auth/register
  -> token/user persisted
  -> redirect by role/status
```

### Chat Escalation

```
Student sends message
  -> existing chat mutation/stream
  -> assistant response appears
  -> AIResponseFeedback renders "Ask a human tutor"
  -> POST /teacher-help/request
  -> request state visible to tutor/parent demo surfaces
```

## Anti-Patterns

### Homepage Feature Buckets

**What people do:** Put AI, teacher, and parent cards side-by-side.
**Why wrong:** It creates three competing product mental models.
**Do instead:** Show a sequential learning flow.

### Component-Level API URLs

**What people do:** Put `fetch('/files/tutor-credentials')` inside upload UI.
**Why wrong:** It breaks future backend replacement.
**Do instead:** Use service functions and hooks.

### Credential Review Claims

**What people do:** Show "verified" or "approved" after upload.
**Why wrong:** The demo backend cannot verify credentials.
**Do instead:** Show `pending_review`.

## Sources

- Appcues onboarding guide, 2026-05-19: role/use-case segmented onboarding is a standard pattern for activation.
- Nielsen Norman Group mobile image guidance, 2023-11-08: use images when they carry informational value, especially on mobile.
- Openfield EdTech onboarding article: progressive scaffolding reduces complexity for education users.
- arXiv 2605.11155: human tutor support can be differentiated by student need in hybrid human-AI tutoring.

---
*Architecture research for: STOA Phase 15*
*Researched: 2026-05-25*
