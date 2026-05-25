# Subscription Model

## Plans

| Plan | Included Access |
|------|-----------------|
| Free Trial | Limited AI questions, limited uploads, basic learning history |
| Student | AI learning chat, homework upload, learning history |
| Family | Student features, parent dashboard, weekly parent report |
| Tutor-supported | Family features, teacher help quota, priority support |

## Access Matrix

| Feature | Free Trial | Student | Family | Tutor-supported |
|---------|------------|---------|--------|-----------------|
| AI messages | Limited | Included | Included | Included |
| File uploads | Limited | Included | Included | Included |
| Learning history | Basic | Included | Included | Included |
| Parent dashboard | Preview | No | Included | Included |
| Weekly reports | Preview | No | Included | Included |
| Teacher help | Limited | No | No | Quota included |

## Enforcement Boundary

The frontend shows plan state, upgrade prompts, locked states, and feature flag behavior. Backend APIs must enforce message quota, upload quota, teacher-help quota, parent report access, and persisted subscription status.

## Payment Flow

Real flow: frontend selects plan, backend creates checkout session, frontend redirects to hosted checkout, provider processes payment, backend receives webhook, frontend reads subscription status.

Virtual flow: frontend selects plan, demo checkout route simulates success or cancel, QA verifies post-checkout states without real payment data.
