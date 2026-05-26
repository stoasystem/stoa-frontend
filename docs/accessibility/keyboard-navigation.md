# Keyboard Navigation

## Required Flows

| Flow | Expected Result | Phase 120 Status |
| --- | --- | --- |
| Homepage navigation to Start learning | Header links, language switcher, and CTA are reachable by Tab. | Source-pass; rendered browser verification deferred. |
| Login form | Email, password, submit, and register link are keyboard reachable. Errors are announced. | Improved. |
| Register multi-step form | Role cards, account fields, terms checkbox, back/continue, and submit are keyboard reachable. | Improved role selection state and error alerts. |
| Chat input | File upload button, textarea, send, stop, and teacher request buttons are keyboard reachable. | Improved labels and live regions. |
| Pricing plan buttons | Plan cards use real buttons/links and keep focusable controls. | Source-pass. |
| Contact form | Fields, selects, textarea, and submit are keyboard reachable; submit is disabled while pending. | Implemented in Phase 119. |
| Language switcher | Native select remains keyboard operable. | Source-pass. |

## Focus Policy

The platform now provides a common focus fallback:

```css
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
[role="button"]:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 3px;
}
```

Component-specific focus rings remain in place for buttons and form controls.

## Known Follow-Up

- Modal focus trapping should be verified in a rendered browser pass.
- Step-change focus management in registration can be improved further by moving focus to the step title after each transition.
- Safari and mobile keyboard behavior are covered by Phase 121 QA.
