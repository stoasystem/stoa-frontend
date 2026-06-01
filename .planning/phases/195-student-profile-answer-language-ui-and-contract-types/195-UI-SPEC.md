# Phase 195 UI Spec

## Surface

- Student registration profile step.
- Authenticated student profile page.

## Design Requirements

- Use existing form density and native select styling already present in the app.
- Keep the new field grouped with learning context, not account/security state.
- Avoid visible technical wording such as provider, prompt, backend, demo, mock, or model.
- Label should be concrete: `Learning Assistant answer language`.
- Helper copy should clarify: this controls the language used for Learning Assistant explanations.

## Responsive Behavior

- Registration profile grid should continue to fit two columns on medium screens and one column on mobile.
- Student profile learning-context grid may expand to four fields on large screens and wrap cleanly below that.

## Accessibility

- Select controls must have labels connected with `htmlFor`.
- Helper text should be visible and not rely only on placeholder text.
- Existing focus styles should be preserved through the app's select class pattern.

